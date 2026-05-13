use soroban_sdk::{contracttype, Address, Env};

use crate::types::RWAAsset;

#[contracttype]
pub enum DataKey {
    Asset(u64),
    TokenCount,
    Admin,
}

pub fn get_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn next_token_id(env: &Env) -> u64 {
    let count: u64 = env
        .storage()
        .instance()
        .get(&DataKey::TokenCount)
        .unwrap_or(0);
    let next = count + 1;
    env.storage().instance().set(&DataKey::TokenCount, &next);
    next
}

pub fn save_asset(env: &Env, token_id: u64, asset: &RWAAsset) {
    env.storage()
        .persistent()
        .set(&DataKey::Asset(token_id), asset);
}

pub fn load_asset(env: &Env, token_id: u64) -> Option<RWAAsset> {
    env.storage()
        .persistent()
        .get(&DataKey::Asset(token_id))
}

pub fn remove_asset(env: &Env, token_id: u64) {
    env.storage()
        .persistent()
        .remove(&DataKey::Asset(token_id));
}
