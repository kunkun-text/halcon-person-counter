package com.halcon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.context.annotation.Bean;

/**
 * Halcon 人数识别系统 - Spring Boot 应用主类
 * 
 * 功能：
 * - 提供图片上传接口
 * - 调用 Halcon 或 OpenCV 进行人数识别
 * - 返回识别结果（人数、置信度、检测框等）
 */
@SpringBootApplication
public class PersonCounterApplication {

    public static void main(String[] args) {
        SpringApplication.run(PersonCounterApplication.class, args);
    }

    /**
     * 配置 CORS，允许前端跨域请求
     */
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("*")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .maxAge(3600);
            }
        };
    }
}
