USE icf_hmis;

-- ============================================================
-- SEED: Shops
-- ============================================================
INSERT IGNORE INTO shops (shop_code, shop_name, department, division, location) VALUES
('CMC', 'Carriage Machine Shop', 'Production', 'Mechanical', 'ICF Chennai'),
('WRS', 'Wheel & Roller Shop', 'Production', 'Mechanical', 'ICF Chennai'),
('PRS', 'Paint & Rust Prevention Shop', 'Production', 'Mechanical', 'ICF Chennai'),
('FRS', 'Furnishing Shop', 'Production', 'Mechanical', 'ICF Chennai'),
('ELS', 'Electrical Shop', 'Production', 'Electrical', 'ICF Chennai'),
('TRS', 'Trimming Shop', 'Production', 'Mechanical', 'ICF Chennai'),
('BDS', 'Body & Bogie Shop', 'Production', 'Mechanical', 'ICF Chennai'),
('HRS', 'Heat Treatment Shop', 'Production', 'Mechanical', 'ICF Chennai'),
('QCS', 'Quality Control Section', 'Quality', 'QA', 'ICF Chennai'),
('ADM', 'Administration', 'Admin', 'General', 'ICF Chennai'),
('MED', 'Medical Department', 'Medical', 'Health', 'ICF Chennai'),
('STR', 'Stores Department', 'Stores', 'Logistics', 'ICF Chennai');

-- ============================================================
-- SEED: Employees (sample from EMPNO_.xlsx structure)
-- ============================================================
INSERT IGNORE INTO employees (EMISCARDNUMBER, emp_name, designation, department, shop_code, category, grade, date_of_joining, date_of_birth, gender) VALUES
('ICF001001', 'RAJESH KUMAR', 'Senior Section Engineer', 'Production', 'CMC', 'Supervisory', 'JA', '2005-06-15', '1975-03-20', 'Male'),
('ICF001002', 'SURESH BABU', 'Technician Gr-I', 'Production', 'CMC', 'Non-Supervisory', 'GP2800', '2008-09-01', '1982-07-14', 'Male'),
('ICF001003', 'PRIYA DEVI', 'Junior Engineer', 'Production', 'CMC', 'Supervisory', 'JE', '2012-03-20', '1988-11-05', 'Female'),
('ICF001004', 'MURUGAN S', 'Technician Gr-II', 'Production', 'CMC', 'Non-Supervisory', 'GP2400', '2010-07-10', '1985-04-22', 'Male'),
('ICF001005', 'LAKSHMI R', 'Technician Gr-III', 'Production', 'CMC', 'Non-Supervisory', 'GP1900', '2015-01-05', '1990-08-30', 'Female'),
('ICF002001', 'VENKATESH P', 'Senior Section Engineer', 'Production', 'WRS', 'Supervisory', 'JA', '2003-11-20', '1973-12-10', 'Male'),
('ICF002002', 'ANAND K', 'Technician Gr-I', 'Production', 'WRS', 'Non-Supervisory', 'GP2800', '2007-04-15', '1980-06-18', 'Male'),
('ICF002003', 'KAVITHA M', 'Junior Engineer', 'Production', 'WRS', 'Supervisory', 'JE', '2014-08-01', '1989-02-25', 'Female'),
('ICF002004', 'RAJAN T', 'Technician Gr-II', 'Production', 'WRS', 'Non-Supervisory', 'GP2400', '2011-05-20', '1986-09-12', 'Male'),
('ICF002005', 'SELVI A', 'Technician Gr-III', 'Production', 'WRS', 'Non-Supervisory', 'GP1900', '2016-03-10', '1992-01-08', 'Female'),
('ICF003001', 'KRISHNAMURTHY V', 'Section Engineer', 'Production', 'PRS', 'Supervisory', 'SS', '2006-02-14', '1976-05-30', 'Male'),
('ICF003002', 'BALAMURUGAN R', 'Technician Gr-I', 'Production', 'PRS', 'Non-Supervisory', 'GP2800', '2009-10-05', '1983-10-15', 'Male'),
('ICF003003', 'MEENA S', 'Technician Gr-II', 'Production', 'PRS', 'Non-Supervisory', 'GP2400', '2013-06-25', '1987-07-20', 'Female'),
('ICF004001', 'SUNDARAM K', 'Senior Section Engineer', 'Production', 'FRS', 'Supervisory', 'JA', '2004-08-30', '1974-09-05', 'Male'),
('ICF004002', 'GANESAN M', 'Technician Gr-I', 'Production', 'FRS', 'Non-Supervisory', 'GP2800', '2008-12-15', '1981-03-28', 'Male'),
('ICF004003', 'RADHA P', 'Technician Gr-III', 'Production', 'FRS', 'Non-Supervisory', 'GP1900', '2017-02-20', '1993-06-14', 'Female'),
('ICF005001', 'ARUMUGAM S', 'Senior Section Engineer', 'Electrical', 'ELS', 'Supervisory', 'JA', '2002-05-10', '1972-11-22', 'Male'),
('ICF005002', 'VIJAYALAKSHMI T', 'Junior Engineer', 'Electrical', 'ELS', 'Supervisory', 'JE', '2013-09-15', '1988-04-17', 'Female'),
('ICF005003', 'SENTHIL K', 'Technician Gr-I', 'Electrical', 'ELS', 'Non-Supervisory', 'GP2800', '2006-07-20', '1979-08-03', 'Male'),
('ICF005004', 'DEEPA R', 'Technician Gr-II', 'Electrical', 'ELS', 'Non-Supervisory', 'GP2400', '2012-11-10', '1986-12-25', 'Female'),
('ICF006001', 'PALANISWAMY G', 'Section Engineer', 'Production', 'TRS', 'Supervisory', 'SS', '2007-03-05', '1977-07-18', 'Male'),
('ICF006002', 'RAMESH B', 'Technician Gr-I', 'Production', 'TRS', 'Non-Supervisory', 'GP2800', '2010-01-25', '1984-02-10', 'Male'),
('ICF007001', 'NATARAJAN P', 'Senior Section Engineer', 'Production', 'BDS', 'Supervisory', 'JA', '2001-09-12', '1971-04-06', 'Male'),
('ICF007002', 'SARASWATHI K', 'Junior Engineer', 'Production', 'BDS', 'Supervisory', 'JE', '2015-06-30', '1990-10-19', 'Female'),
('ICF007003', 'MANIKANDAN R', 'Technician Gr-I', 'Production', 'BDS', 'Non-Supervisory', 'GP2800', '2005-04-18', '1978-01-30', 'Male'),
('ICF008001', 'CHANDRASEKARAN V', 'Section Engineer', 'Production', 'HRS', 'Supervisory', 'SS', '2008-08-22', '1978-06-12', 'Male'),
('ICF008002', 'THILAGAM S', 'Technician Gr-II', 'Production', 'HRS', 'Non-Supervisory', 'GP2400', '2014-04-08', '1989-03-07', 'Female'),
('ICF009001', 'SUBRAMANIAN K', 'Quality Inspector', 'Quality', 'QCS', 'Supervisory', 'SS', '2009-11-30', '1979-09-24', 'Male'),
('ICF009002', 'NIRMALA D', 'Technician Gr-I', 'Quality', 'QCS', 'Non-Supervisory', 'GP2800', '2011-07-14', '1985-05-16', 'Female'),
('ICF010001', 'GOVINDARAJAN M', 'Office Superintendent', 'Admin', 'ADM', 'Supervisory', 'OS', '2000-03-01', '1970-02-28', 'Male');

-- ============================================================
-- SEED: CUG Contacts (SSE contact numbers)
-- ============================================================
INSERT IGNORE INTO cug_contacts (sse_name, EMISCARDNUMBER, cug_number, designation, shop_code, department) VALUES
('RAJESH KUMAR', 'ICF001001', '9444001001', 'Senior Section Engineer', 'CMC', 'Production'),
('VENKATESH P', 'ICF002001', '9444002001', 'Senior Section Engineer', 'WRS', 'Production'),
('KRISHNAMURTHY V', 'ICF003001', '9444003001', 'Section Engineer', 'PRS', 'Production'),
('SUNDARAM K', 'ICF004001', '9444004001', 'Senior Section Engineer', 'FRS', 'Production'),
('ARUMUGAM S', 'ICF005001', '9444005001', 'Senior Section Engineer', 'ELS', 'Electrical'),
('PALANISWAMY G', 'ICF006001', '9444006001', 'Section Engineer', 'TRS', 'Production'),
('NATARAJAN P', 'ICF007001', '9444007001', 'Senior Section Engineer', 'BDS', 'Production'),
('CHANDRASEKARAN V', 'ICF008001', '9444008001', 'Section Engineer', 'HRS', 'Production'),
('SUBRAMANIAN K', 'ICF009001', '9444009001', 'Quality Inspector', 'QCS', 'Quality'),
('GOVINDARAJAN M', 'ICF010001', '9444010001', 'Office Superintendent', 'ADM', 'Admin');

-- ============================================================
-- SEED: Sick/Fit Records (last 90 days sample data)
-- ============================================================
INSERT IGNORE INTO sick_fit_records (EMISCARDNUMBER, status, sick_date, fit_date, diagnosis, reporting_doctor, hospital_name, remarks) VALUES
('ICF001002', 'Sick', DATE_SUB(CURDATE(), INTERVAL 85 DAY), DATE_SUB(CURDATE(), INTERVAL 78 DAY), 'Fever', 'Dr. Ramachandran', 'ICF Hospital', 'Recovered'),
('ICF001004', 'Sick', DATE_SUB(CURDATE(), INTERVAL 80 DAY), DATE_SUB(CURDATE(), INTERVAL 73 DAY), 'Back Pain', 'Dr. Meenakshi', 'ICF Hospital', 'Recovered'),
('ICF002002', 'Sick', DATE_SUB(CURDATE(), INTERVAL 75 DAY), DATE_SUB(CURDATE(), INTERVAL 68 DAY), 'Viral Fever', 'Dr. Ramachandran', 'ICF Hospital', 'Recovered'),
('ICF002004', 'Sick', DATE_SUB(CURDATE(), INTERVAL 70 DAY), NULL, 'Chronic Back Pain', 'Dr. Suresh', 'ICF Hospital', 'Under treatment'),
('ICF003002', 'Sick', DATE_SUB(CURDATE(), INTERVAL 65 DAY), DATE_SUB(CURDATE(), INTERVAL 58 DAY), 'Hypertension', 'Dr. Meenakshi', 'ICF Hospital', 'Recovered'),
('ICF004002', 'Sick', DATE_SUB(CURDATE(), INTERVAL 60 DAY), DATE_SUB(CURDATE(), INTERVAL 53 DAY), 'Dengue Fever', 'Dr. Ramachandran', 'ICF Hospital', 'Recovered'),
('ICF005003', 'Sick', DATE_SUB(CURDATE(), INTERVAL 55 DAY), NULL, 'Diabetes Complications', 'Dr. Suresh', 'ICF Hospital', 'Ongoing'),
('ICF006002', 'Sick', DATE_SUB(CURDATE(), INTERVAL 50 DAY), DATE_SUB(CURDATE(), INTERVAL 43 DAY), 'Fracture', 'Dr. Orthopedic', 'Government Hospital', 'Recovered'),
('ICF007003', 'Sick', DATE_SUB(CURDATE(), INTERVAL 45 DAY), DATE_SUB(CURDATE(), INTERVAL 38 DAY), 'Fever', 'Dr. Ramachandran', 'ICF Hospital', 'Recovered'),
('ICF008002', 'Sick', DATE_SUB(CURDATE(), INTERVAL 40 DAY), NULL, 'Respiratory Issues', 'Dr. Meenakshi', 'ICF Hospital', 'Under treatment'),
('ICF001005', 'Sick', DATE_SUB(CURDATE(), INTERVAL 35 DAY), DATE_SUB(CURDATE(), INTERVAL 28 DAY), 'Viral Fever', 'Dr. Ramachandran', 'ICF Hospital', 'Recovered'),
('ICF002005', 'Sick', DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_SUB(CURDATE(), INTERVAL 23 DAY), 'Typhoid', 'Dr. Suresh', 'ICF Hospital', 'Recovered'),
('ICF003003', 'Sick', DATE_SUB(CURDATE(), INTERVAL 25 DAY), NULL, 'Knee Pain', 'Dr. Orthopedic', 'Government Hospital', 'Ongoing'),
('ICF004003', 'Sick', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 13 DAY), 'Fever', 'Dr. Ramachandran', 'ICF Hospital', 'Recovered'),
('ICF005004', 'Sick', DATE_SUB(CURDATE(), INTERVAL 18 DAY), NULL, 'Hypertension', 'Dr. Meenakshi', 'ICF Hospital', 'Under treatment'),
('ICF007002', 'Sick', DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_SUB(CURDATE(), INTERVAL 8 DAY), 'Viral Fever', 'Dr. Ramachandran', 'ICF Hospital', 'Recovered'),
('ICF009002', 'Sick', DATE_SUB(CURDATE(), INTERVAL 12 DAY), NULL, 'Back Pain', 'Dr. Suresh', 'ICF Hospital', 'Ongoing'),
('ICF001002', 'Sick', DATE_SUB(CURDATE(), INTERVAL 10 DAY), NULL, 'Fever', 'Dr. Ramachandran', 'ICF Hospital', 'Under treatment'),
('ICF002002', 'Sick', DATE_SUB(CURDATE(), INTERVAL 8 DAY), NULL, 'Dengue Fever', 'Dr. Meenakshi', 'ICF Hospital', 'Under treatment'),
('ICF006002', 'Sick', DATE_SUB(CURDATE(), INTERVAL 6 DAY), NULL, 'Viral Fever', 'Dr. Ramachandran', 'ICF Hospital', 'New case'),
('ICF007003', 'Sick', DATE_SUB(CURDATE(), INTERVAL 5 DAY), NULL, 'Hypertension', 'Dr. Suresh', 'ICF Hospital', 'New case'),
('ICF008002', 'Sick', DATE_SUB(CURDATE(), INTERVAL 4 DAY), NULL, 'Fever', 'Dr. Ramachandran', 'ICF Hospital', 'New case'),
('ICF001004', 'Sick', DATE_SUB(CURDATE(), INTERVAL 3 DAY), NULL, 'Back Pain', 'Dr. Meenakshi', 'ICF Hospital', 'New case'),
('ICF003002', 'Sick', DATE_SUB(CURDATE(), INTERVAL 2 DAY), NULL, 'Viral Fever', 'Dr. Ramachandran', 'ICF Hospital', 'New case'),
('ICF004002', 'Sick', DATE_SUB(CURDATE(), INTERVAL 1 DAY), NULL, 'Fever', 'Dr. Suresh', 'ICF Hospital', 'New case'),
('ICF005003', 'Sick', CURDATE(), NULL, 'Respiratory Issues', 'Dr. Meenakshi', 'ICF Hospital', 'New case today');

-- ============================================================
-- SEED: Users (Admin + SSE accounts)
-- Password: Admin@123 (bcrypt hash)
-- ============================================================
INSERT IGNORE INTO users (username, password_hash, full_name, email, role, shop_code) VALUES
('admin', '$2b$10$rOzJqQZQZQZQZQZQZQZQZuKQZQZQZQZQZQZQZQZQZQZQZQZQZQZQa', 'System Administrator', 'admin@icf.railnet.gov.in', 'Admin', NULL),
('pcmo', '$2b$10$rOzJqQZQZQZQZQZQZQZQZuKQZQZQZQZQZQZQZQZQZQZQZQZQZQZQa', 'Principal Chief Medical Officer', 'pcmo@icf.railnet.gov.in', 'Admin', NULL),
('sse_cmc', '$2b$10$rOzJqQZQZQZQZQZQZQZQZuKQZQZQZQZQZQZQZQZQZQZQZQZQZQZQa', 'RAJESH KUMAR', 'sse.cmc@icf.railnet.gov.in', 'SSE', 'CMC'),
('sse_wrs', '$2b$10$rOzJqQZQZQZQZQZQZQZQZuKQZQZQZQZQZQZQZQZQZQZQZQZQZQZQa', 'VENKATESH P', 'sse.wrs@icf.railnet.gov.in', 'SSE', 'WRS'),
('sse_els', '$2b$10$rOzJqQZQZQZQZQZQZQZQZuKQZQZQZQZQZQZQZQZQZQZQZQZQZQZQa', 'ARUMUGAM S', 'sse.els@icf.railnet.gov.in', 'SSE', 'ELS');

-- ============================================================
-- SEED: Sample Notifications
-- ============================================================
INSERT IGNORE INTO notifications (title, message, type, shop_code) VALUES
('High Sick Count Alert', 'CMC shop has 5 employees on sick leave this week', 'alert', 'CMC'),
('New Cases Today', '3 new sick cases reported today across ICF', 'warning', NULL),
('Weekly Report Ready', 'Weekly sick/fit monitoring report for current week is ready', 'info', NULL),
('Recovery Update', '2 employees from WRS shop have been declared fit', 'success', 'WRS');
