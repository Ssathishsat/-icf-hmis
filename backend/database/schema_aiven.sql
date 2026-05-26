-- ============================================================
-- ICF HMIS - Aiven-compatible Schema (no CURDATE() in generated columns)
-- ============================================================

CREATE TABLE IF NOT EXISTS shops (
  shop_id       INT AUTO_INCREMENT PRIMARY KEY,
  shop_code     VARCHAR(20) NOT NULL UNIQUE,
  shop_name     VARCHAR(100) NOT NULL,
  department    VARCHAR(100),
  division      VARCHAR(50),
  location      VARCHAR(100),
  is_active     TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_shop_code (shop_code),
  INDEX idx_department (department)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS employees (
  EMISCARDNUMBER    VARCHAR(20) PRIMARY KEY,
  emp_name          VARCHAR(150) NOT NULL,
  designation       VARCHAR(100),
  department        VARCHAR(100),
  shop_code         VARCHAR(20),
  category          ENUM('Supervisory','Non-Supervisory') DEFAULT 'Non-Supervisory',
  grade             VARCHAR(20),
  date_of_joining   DATE,
  date_of_birth     DATE,
  gender            ENUM('Male','Female','Other') DEFAULT 'Male',
  is_active         TINYINT(1) DEFAULT 1,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  empno             VARCHAR(20),
  hrms_id           VARCHAR(20),
  ipas_id           VARCHAR(20),
  payunit           VARCHAR(20),
  cell_no           VARCHAR(20),
  age               INT,
  sf_code           VARCHAR(10),
  FOREIGN KEY (shop_code) REFERENCES shops(shop_code) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_shop_code (shop_code),
  INDEX idx_department (department),
  INDEX idx_category (category),
  INDEX idx_emp_name (emp_name)
) ENGINE=InnoDB;

-- days_count is a plain INT (not generated) — Aiven doesn't allow CURDATE() in generated columns
CREATE TABLE IF NOT EXISTS sick_fit_records (
  record_id         INT AUTO_INCREMENT PRIMARY KEY,
  EMISCARDNUMBER    VARCHAR(20) NOT NULL,
  status            ENUM('Sick','Fit') NOT NULL DEFAULT 'Sick',
  sick_date         DATE NOT NULL,
  fit_date          DATE,
  days_count        INT,
  diagnosis         VARCHAR(255),
  reporting_doctor  VARCHAR(150),
  hospital_name     VARCHAR(150),
  remarks           TEXT,
  week_number       INT GENERATED ALWAYS AS (WEEK(sick_date, 1)) STORED,
  month_number      INT GENERATED ALWAYS AS (MONTH(sick_date)) STORED,
  year_number       INT GENERATED ALWAYS AS (YEAR(sick_date)) STORED,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (EMISCARDNUMBER) REFERENCES employees(EMISCARDNUMBER) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_emis (EMISCARDNUMBER),
  INDEX idx_status (status),
  INDEX idx_sick_date (sick_date),
  INDEX idx_week (week_number, year_number),
  INDEX idx_month (month_number, year_number),
  INDEX idx_status_date (status, sick_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cug_contacts (
  contact_id        INT AUTO_INCREMENT PRIMARY KEY,
  sse_name          VARCHAR(150) NOT NULL,
  EMISCARDNUMBER    VARCHAR(20),
  cug_number        VARCHAR(20) NOT NULL,
  designation       VARCHAR(100),
  shop_code         VARCHAR(20),
  department        VARCHAR(100),
  is_active         TINYINT(1) DEFAULT 1,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_code) REFERENCES shops(shop_code) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_shop_code (shop_code),
  INDEX idx_sse_name (sse_name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sse_assignments (
  assignment_id     INT AUTO_INCREMENT PRIMARY KEY,
  EMISCARDNUMBER    VARCHAR(20) NOT NULL,
  shop_code         VARCHAR(20) NOT NULL,
  assigned_date     DATE NOT NULL,
  is_current        TINYINT(1) DEFAULT 1,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (EMISCARDNUMBER) REFERENCES employees(EMISCARDNUMBER) ON DELETE CASCADE,
  FOREIGN KEY (shop_code) REFERENCES shops(shop_code) ON DELETE CASCADE,
  INDEX idx_emis (EMISCARDNUMBER),
  INDEX idx_shop (shop_code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  user_id           INT AUTO_INCREMENT PRIMARY KEY,
  username          VARCHAR(50) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  full_name         VARCHAR(150) NOT NULL,
  email             VARCHAR(150),
  role              ENUM('Admin','SSE','Viewer') NOT NULL DEFAULT 'Viewer',
  EMISCARDNUMBER    VARCHAR(20),
  shop_code         VARCHAR(20),
  is_active         TINYINT(1) DEFAULT 1,
  last_login        TIMESTAMP NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id           INT,
  username          VARCHAR(50),
  action            VARCHAR(100) NOT NULL,
  resource          VARCHAR(100),
  resource_id       VARCHAR(50),
  ip_address        VARCHAR(45),
  user_agent        TEXT,
  request_data      JSON,
  response_status   INT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  notif_id          INT AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(200) NOT NULL,
  message           TEXT NOT NULL,
  type              ENUM('alert','warning','info','success') DEFAULT 'info',
  shop_code         VARCHAR(20),
  is_read           TINYINT(1) DEFAULT 0,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ipd_records (
  ipd_id            INT AUTO_INCREMENT PRIMARY KEY,
  sl_no             INT,
  cr_no             VARCHAR(30),
  admission_no      VARCHAR(30),
  EMISCARDNUMBER    VARCHAR(20),
  patient_name      VARCHAR(150),
  category_id       VARCHAR(50),
  age_sex           VARCHAR(20),
  mobile            VARCHAR(20),
  dept_ward         VARCHAR(100),
  admission_date    DATE,
  admission_time    VARCHAR(20),
  acceptance_status VARCHAR(50),
  consultant        VARCHAR(150),
  operator          VARCHAR(100),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_emis (EMISCARDNUMBER),
  INDEX idx_admission_date (admission_date)
) ENGINE=InnoDB;
