package com.insurai.backend;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class TestDB {
    public static void main(String[] args) {
        try {
            Connection conn = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/insurai", "root", "luckys09"
            );
            System.out.println("Database connected!");
            conn.close();
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}