pub const canonical_label = "Payment.amount.isBetween";

pub fn isBetween(value: i64, lower: i64, upper: i64) bool {
    return value >= lower and value <= upper;
}
