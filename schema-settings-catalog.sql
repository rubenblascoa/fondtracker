CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(255) PRIMARY KEY,
    setting_value TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fund_catalog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    isin VARCHAR(12) NOT NULL,
    name VARCHAR(500) NOT NULL,
    bank VARCHAR(255) NOT NULL DEFAULT '',
    category VARCHAR(100) NOT NULL DEFAULT '',
    risk_level INT NOT NULL DEFAULT 3,
    currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
    yahoo_ticker VARCHAR(30) DEFAULT NULL,
    UNIQUE KEY unique_isin (isin),
    FULLTEXT KEY ft_fund_search (name, isin, bank, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
