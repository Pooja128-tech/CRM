
package com.izeon.izeon_crm;

import jakarta.servlet.http.HttpSession;

public final class SessionAuth {

    private SessionAuth() {
        // Utility class; no instances required.
    }

    public static boolean hasRole(
            HttpSession session,
            String requiredRole) {

        if (session == null || requiredRole == null) {
            return false;
        }

        Object role = session.getAttribute("crmUserRole");

        return role instanceof String
                && requiredRole.equalsIgnoreCase((String) role);
    }

    public static boolean isLoggedIn(HttpSession session) {
        return session != null
                && session.getAttribute("crmUserId") != null
                && session.getAttribute("crmUserRole") != null;
    }
}
