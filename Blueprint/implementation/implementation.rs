pub const CANONICAL_LABEL: &str = "Payment.amount.isBetween";

pub fn is_between(value: i64, lower: i64, upper: i64) -> bool {
    value >= lower && value <= upper
}
