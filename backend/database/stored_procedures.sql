USE icf_hmis;

DELIMITER $$

-- ============================================================
-- SP: Get Dashboard KPI Summary
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_get_dashboard_kpi(
  IN p_from_date DATE,
  IN p_to_date   DATE
)
BEGIN
  SELECT
    (SELECT COUNT(DISTINCT EMISCARDNUMBER) FROM sick_fit_records
     WHERE status = 'Sick' AND sick_date BETWEEN p_from_date AND p_to_date) AS total_sick,
    (SELECT COUNT(DISTINCT EMISCARDNUMBER) FROM sick_fit_records
     WHERE status = 'Fit' AND sick_date BETWEEN p_from_date AND p_to_date) AS total_fit,
    (SELECT COUNT(*) FROM employees WHERE category = 'Supervisory' AND is_active = 1) AS total_supervisory,
    (SELECT COUNT(*) FROM employees WHERE category = 'Non-Supervisory' AND is_active = 1) AS total_non_supervisory,
    (SELECT COUNT(DISTINCT r.EMISCARDNUMBER) FROM sick_fit_records r
     WHERE WEEK(r.sick_date, 1) = WEEK(CURDATE(), 1) AND YEAR(r.sick_date) = YEAR(CURDATE())) AS current_week_cases,
    (SELECT COUNT(DISTINCT r.EMISCARDNUMBER) FROM sick_fit_records r
     WHERE MONTH(r.sick_date) = MONTH(CURDATE()) AND YEAR(r.sick_date) = YEAR(CURDATE())) AS monthly_cases,
    (SELECT COUNT(DISTINCT e.shop_code) FROM sick_fit_records r
     JOIN employees e ON r.EMISCARDNUMBER = e.EMISCARDNUMBER
     WHERE r.sick_date BETWEEN p_from_date AND p_to_date) AS shops_affected,
    (SELECT COUNT(DISTINCT c.shop_code) FROM cug_contacts c WHERE c.is_active = 1) AS active_sse_count;
END$$

-- ============================================================
-- SP: Get Day-wise Trend
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_get_daywise_trend(
  IN p_from_date DATE,
  IN p_to_date   DATE
)
BEGIN
  SELECT
    DATE(sick_date) AS trend_date,
    SUM(CASE WHEN status = 'Sick' THEN 1 ELSE 0 END) AS sick_count,
    SUM(CASE WHEN status = 'Fit' THEN 1 ELSE 0 END) AS fit_count,
    COUNT(*) AS total_count
  FROM sick_fit_records
  WHERE sick_date BETWEEN p_from_date AND p_to_date
  GROUP BY DATE(sick_date)
  ORDER BY trend_date;
END$$

-- ============================================================
-- SP: Get Shop-wise Distribution
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_get_shop_distribution(
  IN p_from_date DATE,
  IN p_to_date   DATE
)
BEGIN
  SELECT
    s.shop_code,
    s.shop_name,
    COUNT(CASE WHEN r.status = 'Sick' THEN 1 END) AS sick_count,
    COUNT(CASE WHEN r.status = 'Fit' THEN 1 END) AS fit_count,
    COUNT(r.record_id) AS total_cases,
    ROUND(COUNT(r.record_id) * 100.0 / NULLIF((
      SELECT COUNT(*) FROM sick_fit_records
      WHERE sick_date BETWEEN p_from_date AND p_to_date
    ), 0), 2) AS percentage
  FROM shops s
  LEFT JOIN employees e ON s.shop_code = e.shop_code
  LEFT JOIN sick_fit_records r ON e.EMISCARDNUMBER = r.EMISCARDNUMBER
    AND r.sick_date BETWEEN p_from_date AND p_to_date
  GROUP BY s.shop_code, s.shop_name
  ORDER BY total_cases DESC;
END$$

-- ============================================================
-- SP: Get Shop Drilldown Details
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_get_shop_drilldown(
  IN p_shop_code VARCHAR(20),
  IN p_from_date DATE,
  IN p_to_date   DATE
)
BEGIN
  -- Shop summary
  SELECT
    s.shop_code, s.shop_name, s.department,
    c.sse_name, c.cug_number, c.designation AS sse_designation,
    COUNT(CASE WHEN r.status = 'Sick' THEN 1 END) AS sick_count,
    COUNT(CASE WHEN r.status = 'Fit' THEN 1 END) AS fit_count
  FROM shops s
  LEFT JOIN cug_contacts c ON s.shop_code = c.shop_code AND c.is_active = 1
  LEFT JOIN employees e ON s.shop_code = e.shop_code
  LEFT JOIN sick_fit_records r ON e.EMISCARDNUMBER = r.EMISCARDNUMBER
    AND r.sick_date BETWEEN p_from_date AND p_to_date
  WHERE s.shop_code = p_shop_code
  GROUP BY s.shop_code, s.shop_name, s.department, c.sse_name, c.cug_number, c.designation;

  -- Employee list
  SELECT
    e.EMISCARDNUMBER, e.emp_name, e.designation, e.department,
    e.category, r.status, r.sick_date, r.fit_date,
    r.days_count, r.reporting_doctor, r.diagnosis
  FROM employees e
  JOIN sick_fit_records r ON e.EMISCARDNUMBER = r.EMISCARDNUMBER
  WHERE e.shop_code = p_shop_code
    AND r.sick_date BETWEEN p_from_date AND p_to_date
  ORDER BY r.sick_date DESC;
END$$

-- ============================================================
-- SP: Get Weekly Monitoring Data
-- ============================================================
CREATE PROCEDURE IF NOT EXISTS sp_get_weekly_monitoring(
  IN p_week  INT,
  IN p_year  INT
)
BEGIN
  SELECT
    r.EMISCARDNUMBER, e.emp_name, e.designation, e.shop_code,
    s.shop_name, e.category, r.status, r.sick_date, r.fit_date,
    r.days_count, r.reporting_doctor,
    CASE WHEN WEEK(r.sick_date, 1) = p_week AND YEAR(r.sick_date) = p_year THEN 'New'
         WHEN r.fit_date IS NOT NULL AND WEEK(r.fit_date, 1) = p_week AND YEAR(r.fit_date) = p_year THEN 'Recovered'
         ELSE 'Ongoing' END AS weekly_status
  FROM sick_fit_records r
  JOIN employees e ON r.EMISCARDNUMBER = e.EMISCARDNUMBER
  LEFT JOIN shops s ON e.shop_code = s.shop_code
  WHERE (WEEK(r.sick_date, 1) = p_week AND YEAR(r.sick_date) = p_year)
     OR (r.fit_date IS NULL AND r.sick_date <= STR_TO_DATE(CONCAT(p_year, p_week, ' Monday'), '%X%V %W'))
  ORDER BY r.sick_date DESC;
END$$

DELIMITER ;
