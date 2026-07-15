CREATE TABLE IF NOT EXISTS investments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    isin VARCHAR(12) NOT NULL,
    name VARCHAR(255) NOT NULL,
    bank VARCHAR(255) NOT NULL DEFAULT '',
    category VARCHAR(100) NOT NULL DEFAULT '',
    ticker VARCHAR(30) DEFAULT NULL,
    shares DECIMAL(15,6) NOT NULL,
    purchase_price DECIMAL(15,6) NOT NULL,
    purchase_date DATE NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'EUR',
    notes TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_investments_isin ON investments(isin);

CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fund_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fund_id INT NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    recorded_at DATETIME NOT NULL,
    FOREIGN KEY (fund_id) REFERENCES investments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_fund_history_fund ON fund_history(fund_id);
CREATE INDEX idx_fund_history_date ON fund_history(recorded_at DESC);
