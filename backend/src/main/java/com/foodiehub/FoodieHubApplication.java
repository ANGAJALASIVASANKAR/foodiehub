package com.foodiehub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class FoodieHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(FoodieHubApplication.class, args);
    }
}
