use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RiskGrade {
    A,
    B,
    C,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct RWAAsset {
    pub invoice_id: String,
    pub owner: Address,
    pub value: i128,
    pub due_date: u64,
    pub risk_grade: RiskGrade,
}
