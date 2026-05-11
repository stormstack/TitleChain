#![no_std]

mod errors;
mod storage;
mod types;

use errors::Error;
use soroban_sdk::{contract, contractimpl, Address, Env, String};
use storage::{get_admin, load_asset, next_token_id, remove_asset, save_asset, set_admin};
use types::{RWAAsset, RiskGrade};

#[contract]
pub struct RWAMintContract;

#[contractimpl]
impl RWAMintContract {
    /// Initialize the contract with a protocol admin address.
    pub fn initialize(env: Env, admin: Address) {
        set_admin(&env, &admin);
    }

    /// Mint a new RWA token for a verified invoice.
    /// Returns the assigned token_id.
    pub fn mint(
        env: Env,
        invoice_id: String,
        owner: Address,
        value: i128,
        due_date: u64,
        risk_grade: RiskGrade,
    ) -> Result<u64, Error> {
        if value <= 0 {
            return Err(Error::InvalidInput);
        }

        let token_id = next_token_id(&env);
        let asset = RWAAsset {
            invoice_id,
            owner,
            value,
            due_date,
            risk_grade,
        };
        save_asset(&env, token_id, &asset);
        Ok(token_id)
    }

    /// Retrieve the asset data for a given token_id.
    pub fn get_asset(env: Env, token_id: u64) -> Result<RWAAsset, Error> {
        load_asset(&env, token_id).ok_or(Error::TokenNotFound)
    }

    /// Returns true if the token exists (has not been burned).
    pub fn is_valid(env: Env, token_id: u64) -> bool {
        load_asset(&env, token_id).is_some()
    }

    /// Burn a token. Only callable by the protocol admin.
    pub fn burn(env: Env, caller: Address, token_id: u64) -> Result<(), Error> {
        caller.require_auth();
        let admin = get_admin(&env);
        if caller != admin {
            return Err(Error::Unauthorized);
        }
        if load_asset(&env, token_id).is_none() {
            return Err(Error::TokenNotFound);
        }
        remove_asset(&env, token_id);
        Ok(())
    }
}
