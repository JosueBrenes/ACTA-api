#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, String, Symbol};

const HASH_KEY: Symbol = symbol_short!("hash");
const STATUS_KEY: Symbol = symbol_short!("status");

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CredentialStatus {
    Active,
    Revoked,
    Suspended,
}

#[contract]
pub struct CredentialContract;

#[contractimpl]
impl CredentialContract {
    pub fn initialize(env: Env, hash: String, status: CredentialStatus) {
        env.storage().instance().set(&HASH_KEY, &hash);
        env.storage().instance().set(&STATUS_KEY, &status);
    }

    pub fn get_hash(env: Env) -> String {
        env.storage().instance().get(&HASH_KEY).unwrap()
    }

    pub fn get_status(env: Env) -> CredentialStatus {
        env.storage().instance().get(&STATUS_KEY).unwrap()
    }

    pub fn update_status(env: Env, new_status: CredentialStatus) {
        env.storage().instance().set(&STATUS_KEY, &new_status);
    }

    pub fn get_credential_info(env: Env) -> (String, CredentialStatus) {
        let hash: String = env.storage().instance().get(&HASH_KEY).unwrap();
        let status: CredentialStatus = env.storage().instance().get(&STATUS_KEY).unwrap();
        (hash, status)
    }
}