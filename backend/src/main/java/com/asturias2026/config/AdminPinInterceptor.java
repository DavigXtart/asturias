package com.asturias2026.config;

import com.asturias2026.config_.ConfigService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

public class AdminPinInterceptor implements HandlerInterceptor {

    private final ConfigService config;

    public AdminPinInterceptor(ConfigService config) {
        this.config = config;
    }

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            return true;
        }
        if (config.pinMatches(req.getHeader("X-Admin-Pin"))) {
            return true;
        }
        res.setStatus(403);
        return false;
    }
}
