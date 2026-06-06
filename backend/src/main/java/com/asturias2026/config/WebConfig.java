package com.asturias2026.config;

import com.asturias2026.config_.ConfigService;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final ConfigService config;

    public WebConfig(ConfigService config) {
        this.config = config;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new AdminPinInterceptor(config))
                .addPathPatterns("/api/admin/**");
    }
}
