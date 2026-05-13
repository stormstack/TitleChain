use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyMinted = 1,
    TokenNotFound = 2,
    Unauthorized = 3,
    InvalidInput = 4,
}
