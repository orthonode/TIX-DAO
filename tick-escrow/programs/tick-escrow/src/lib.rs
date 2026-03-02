use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer, CloseAccount},
};

declare_id!("4zoxHUogrvHXZDfikE17JGbf9zfmNfR4E8YCD8Ltt9st");

#[program]
pub mod tick_escrow {
    use super::*;

    pub fn lock_tokens(
        ctx: Context<LockTokens>,
        amount: u64,
        lock_duration_days: u16,
    ) -> Result<()> {
        require!(amount > 0, EscrowError::ZeroAmount);
        require!(
            matches!(lock_duration_days, 30 | 90 | 180 | 365),
            EscrowError::InvalidDuration
        );

        let multiplier_bps: u16 = match lock_duration_days {
            30  => 100,
            90  => 200,
            180 => 300,
            365 => 400,
            _   => unreachable!(),
        };

        // Transfer TICK from user ATA → escrow ATA
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.owner_tick_ata.to_account_info(),
                    to:        ctx.accounts.escrow_tick_ata.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            amount,
        )?;

        let clock = Clock::get()?;
        let lock_end_ts = clock.unix_timestamp + (lock_duration_days as i64) * 86_400;

        let escrow           = &mut ctx.accounts.escrow_account;
        escrow.owner          = ctx.accounts.owner.key();
        escrow.tick_mint      = ctx.accounts.tick_mint.key();
        escrow.locked_amount  = amount;
        escrow.lock_end_ts    = lock_end_ts;
        escrow.multiplier_bps = multiplier_bps;
        escrow.bump           = ctx.bumps.escrow_account;

        emit!(TokensLocked { owner: escrow.owner, amount, lock_end_ts, multiplier_bps });
        Ok(())
    }

    pub fn unlock_tokens(ctx: Context<UnlockTokens>) -> Result<()> {
        let escrow = &ctx.accounts.escrow_account;
        require!(
            Clock::get()?.unix_timestamp >= escrow.lock_end_ts,
            EscrowError::LockNotExpired
        );

        let amount        = escrow.locked_amount;
        let bump          = escrow.bump;
        let owner_key     = escrow.owner;
        let tick_mint_key = escrow.tick_mint;

        let seeds: &[&[u8]] = &[
            b"tick_escrow",
            owner_key.as_ref(),
            tick_mint_key.as_ref(),
            &[bump],
        ];
        let signer = &[seeds];

        // Transfer TICK from escrow ATA → owner ATA (PDA-signed)
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from:      ctx.accounts.escrow_tick_ata.to_account_info(),
                    to:        ctx.accounts.owner_tick_ata.to_account_info(),
                    authority: ctx.accounts.escrow_account.to_account_info(),
                },
                signer,
            ),
            amount,
        )?;

        // Close the escrow token ATA (return rent to owner)
        token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account:     ctx.accounts.escrow_tick_ata.to_account_info(),
                destination: ctx.accounts.owner.to_account_info(),
                authority:   ctx.accounts.escrow_account.to_account_info(),
            },
            signer,
        ))?;

        emit!(TokensUnlocked { owner: owner_key, amount });
        Ok(())
    }
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct LockTokens<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = EscrowAccount::LEN,
        seeds = [b"tick_escrow", owner.key().as_ref(), tick_mint.key().as_ref()],
        bump,
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    pub tick_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint      = tick_mint,
        associated_token::authority = owner,
    )]
    pub owner_tick_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint      = tick_mint,
        associated_token::authority = escrow_account,
    )]
    pub escrow_tick_ata: Account<'info, TokenAccount>,

    pub token_program:            Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
}

#[derive(Accounts)]
pub struct UnlockTokens<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        close = owner,
        seeds = [b"tick_escrow", owner.key().as_ref(), escrow_account.tick_mint.as_ref()],
        bump  = escrow_account.bump,
        constraint = escrow_account.owner == owner.key() @ EscrowError::Unauthorized,
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    pub tick_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint      = tick_mint,
        associated_token::authority = owner,
    )]
    pub owner_tick_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint      = tick_mint,
        associated_token::authority = escrow_account,
    )]
    pub escrow_tick_ata: Account<'info, TokenAccount>,

    pub token_program:            Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program:           Program<'info, System>,
}

// ─── State ────────────────────────────────────────────────────────────────────

#[account]
pub struct EscrowAccount {
    pub owner:          Pubkey,  // 32
    pub tick_mint:      Pubkey,  // 32
    pub locked_amount:  u64,     // 8
    pub lock_end_ts:    i64,     // 8
    pub multiplier_bps: u16,     // 2
    pub bump:           u8,      // 1
}
impl EscrowAccount {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 2 + 1; // = 91
}

// ─── Events ───────────────────────────────────────────────────────────────────

#[event]
pub struct TokensLocked {
    pub owner:          Pubkey,
    pub amount:         u64,
    pub lock_end_ts:    i64,
    pub multiplier_bps: u16,
}

#[event]
pub struct TokensUnlocked {
    pub owner:  Pubkey,
    pub amount: u64,
}

// ─── Errors ───────────────────────────────────────────────────────────────────

#[error_code]
pub enum EscrowError {
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Duration must be 30, 90, 180, or 365")]
    InvalidDuration,
    #[msg("Lock period has not expired yet")]
    LockNotExpired,
    #[msg("Signer is not the escrow owner")]
    Unauthorized,
}
