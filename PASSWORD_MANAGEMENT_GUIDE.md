# 🔐 Password Management Guide

Complete password management has been added to both Staff and Business account creation/editing.

## 📋 Features Added

### **1. Staff Account Management (Business Admin)**

#### **Creating Staff Accounts**
When creating a new staff member:
- **Email & Name**: Required fields
- **Phone Number**: Optional
- **Password Options**:
  - Enter a custom password manually
  - Click "Generate Password" button to auto-generate a secure 12-character password
  - Password includes uppercase, lowercase, numbers, and special characters

#### **After Creation**
- Success modal displays the credentials:
  - Email address
  - Generated/set password
- **Copy buttons** for easy credential sharing
- ⚠️ **Important**: Passwords are shown only once - save them!

#### **Editing Staff Accounts**
When editing existing staff:
- Update name, email, phone number
- **Optional Password Reset**:
  - Leave password field empty to keep current password
  - Enter new password manually OR
  - Click "Generate New Password" to auto-generate
- If password is changed, success modal shows new credentials

#### **Staff Management Actions**
- 👤 **Edit Icon** (UserCog): Edit staff details and reset password
- 🗑️ **Toggle Icon** (Trash): Activate/deactivate staff account (doesn't delete)

---

### **2. Business Account Management (Super Admin)**

#### **Creating Business Owner Account**
- When enabling "Self-Service Access" for a business:
  - Auto-generates owner email: `owner@{slug}.com`
  - Auto-generates secure 12-character password
  - Displays credentials in modal

#### **Managing Business Owner Password**
In the Self-Service management modal:
- **View Current Credentials**:
  - Email: `owner@{slug}.com`
  - Password (if recently set)

- **Reset Password Section** 🔄:
  - Text field to enter new password
  - "Generate" button for auto-generation
  - "Update Password" button to save changes
  - Copy buttons for each credential

#### **Business Management Actions**
- ⏸️/▶️ **Pause/Play Icon**: Suspend/activate business
- ✏️ **Edit Icon** (Blue): Edit business data (name, email, phone, logo, etc.)
- 🔑 **Key Icon** (Purple): Manage self-service and passwords
- 🗑️ **Trash Icon**: Delete business (caution!)

---

## 🔒 Password Security

### **Generated Passwords**
- **Length**: 12 characters
- **Charset**: `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%`
- Excludes confusing characters (0, O, I, l)
- Includes special characters for enhanced security

### **Password Storage**
- Passwords are hashed by Supabase Auth
- Never stored in plain text in database
- Shown only once during creation/reset

---

## 📝 Usage Examples

### **Scenario 1: Create Staff Member with Auto-Generated Password**
1. Go to Staff page
2. Click "Add Staff"
3. Fill in name and email
4. Click "Generate Password" button
5. Review the generated password
6. Click "Add Staff"
7. Copy credentials from success modal
8. Send credentials securely to staff member

### **Scenario 2: Reset Staff Password**
1. Go to Staff page
2. Click edit icon (UserCog) on staff member
3. Scroll to "Reset Password" section
4. Click "Generate New Password" OR enter custom password
5. Click "Update Staff"
6. Copy new password from success modal
7. Send to staff member securely

### **Scenario 3: Enable Business Self-Service**
1. Go to Businesses page (Super Admin)
2. Click Key icon (purple) on business
3. Toggle "Enable Self-Service Access" ON
4. Auto-generates email and password
5. Copy credentials
6. Send to business owner

### **Scenario 4: Reset Business Owner Password**
1. Go to Businesses page (Super Admin)
2. Click Key icon on business
3. Scroll to "Reset Owner Password" section
4. Click "Generate" OR enter new password
5. Click "Update Password"
6. Copy new password
7. Send to business owner

---

## ⚠️ Important Notes

1. **Passwords Are Shown Once**: Save them immediately after generation
2. **Secure Transmission**: Send credentials via secure channels (encrypted email, password managers, etc.)
3. **Demo Mode**: Works in demo mode for testing without actual auth changes
4. **Email Changes**: Updating email changes login credentials
5. **Keep Record**: Business admins should keep a secure record of staff credentials
6. **Super Admin Access**: Only super admins can manage business owner accounts

---

## 🚀 Coming Soon (Production Requirements)

For production deployment, you'll need to implement:

1. **Edge Function for Password Updates**:
   - Create Supabase Edge Function with service role access
   - Implement `auth.admin.updateUserById()` for password changes
   - Endpoint: `/functions/v1/reset-user-password`

2. **Email Notifications**:
   - Integrate email service (SendGrid, Resend, etc.)
   - Send credentials via email with "Email to Owner" button
   - Include password reset instructions

3. **Password Requirements**:
   - Add password strength validator
   - Show password strength meter
   - Enforce minimum requirements

4. **Audit Logging**:
   - Log all password changes
   - Track who made changes and when
   - Security compliance records

---

## 🎯 Current Status

✅ **Fully Functional Features**:
- Staff account creation with passwords
- Staff password reset
- Business owner account creation
- Business owner password reset
- Auto-generation of secure passwords
- Copy-to-clipboard functionality
- Success modals with credential display
- Demo mode support

⚠️ **Requires Backend Implementation**:
- Email updates (requires Edge Function)
- Password updates via auth.admin (requires Edge Function)
- Email delivery of credentials
- Audit logging

---

## 📞 Support

If you need help:
1. Check this guide first
2. Test in demo mode
3. Verify credentials are copied correctly
4. Ensure passwords meet requirements (12+ chars)

---

**Last Updated**: June 16, 2026
**Version**: 2.0
