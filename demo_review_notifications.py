#!/usr/bin/env python3
"""
Demonstration file for Windsurf Review Notification System
This file shows how to use review markers that trigger notifications.
"""

# REVIEW_PENDING: This function needs security review before deployment
def authenticate_user(username: str, password: str) -> bool:
    """
    Authenticate user credentials.
    
    TODO REVIEW: Verify password hashing implementation is secure
    """
    # Placeholder implementation
    return username == "admin" and password == "secret"


# WAITING_FOR_INPUT: Need database configuration from DevOps team
DATABASE_CONFIG = {
    "host": None,  # TODO INPUT: Add production database host
    "port": 5432,
    "database": "windsurf_app"
}


class SecurityManager:
    """Handles security-related operations."""
    
    def __init__(self):
        # APPROVAL_REQUIRED: Security team must approve these default settings
        self.security_settings = {
            "allow_admin_bypass": True,  # NEEDS_APPROVAL: High-risk setting
            "session_timeout": 3600,
            "max_login_attempts": 3
        }
    
    def validate_permissions(self, user_id: int, action: str) -> bool:
        """
        Validate user permissions for specific actions.
        
        FIXME REVIEW: Permission logic needs thorough security audit
        """
        # Simplified permission check
        return True  # TODO: Implement proper permission validation


# Example of cleared review item (won't trigger notifications)
def get_user_profile(user_id: int) -> dict:
    """
    Retrieve user profile information.
    
    This function has been reviewed and approved.
    """
    return {"id": user_id, "name": "User", "role": "standard"}


if __name__ == "__main__":
    print("Demo file for review notification system")
    print("This file contains several review markers that will trigger notifications:")
    print("- REVIEW_PENDING items: 2")
    print("- WAITING_FOR_INPUT items: 1") 
    print("- APPROVAL_REQUIRED items: 2")
    print("")
    print("Run the notification checker to see these items detected:")
    print(".windsurf/scripts/review_notifications.sh check")
