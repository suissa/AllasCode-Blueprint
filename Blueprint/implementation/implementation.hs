module PaymentAmountIsBetween where

canonicalLabel :: String
canonicalLabel = "Payment.amount.isBetween"

isBetween :: Integer -> Integer -> Integer -> Bool
isBetween value lower upper = value >= lower && value <= upper
