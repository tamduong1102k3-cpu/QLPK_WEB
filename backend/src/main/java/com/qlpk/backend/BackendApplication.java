package com.qlpk.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@ComponentScan(basePackages = "com.qlpk.backend")
@EnableScheduling
public class BackendApplication implements CommandLineRunner {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	public static void main(String[] args) {

		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
		SpringApplication.run(BackendApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		try {
			System.out.println("--- ĐANG ĐỒNG BỘ CƠ SỞ DỮ LIỆU TỰ ĐỘNG ---");
			jdbcTemplate.execute("ALTER TABLE kham_lam_sang MODIFY COLUMN ket_qua_kham_can_lam_sang TEXT");
			jdbcTemplate.execute("ALTER TABLE kham_lam_sang MODIFY COLUMN kham_lam_sang TEXT");
			System.out.println("--- ĐỒNG BỘ CƠ SỞ DỮ LIỆU THÀNH CÔNG! ---");
		} catch (Exception e) {
			System.err.println("Lỗi khi đồng bộ cơ sở dữ liệu: " + e.getMessage());
		}
	}
}
