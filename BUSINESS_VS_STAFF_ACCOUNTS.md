# 🏢 Business vs Staff Account Management

## Understanding the Two Account Types

### **BUSINESS OWNER Account**
- **Created when**: You enable "Self-Service Access" on a business
- **Email format**: `owner@{business-slug}.com` (auto-generated)
- **Purpose**: Allows business owner to manage their own loyalty programs, staff, customers
- **Managed via**: 🔑 **Key Icon** (purple) in Businesses page
- **Password**: Set when enabling self-service OR reset in Self-Service modal

### **STAFF Account**
- **Created when**: Business admin adds a staff member
- **Email format**: Any email you choose (e.g., `john@coffee-shop.com`)
- **Purpose**: Staff can scan QR codes, look up customers, issue points
- **Managed via**: Staff page (business admin only)
- **Password**: Set during creation OR reset when editing staff

---

## 🔐 Where to Manage Passwords

### **For BUSINESS OWNERS:**

#### **Initial Setup:**
1. Go to **Super Admin → Businesses**
2. Find the business
3. Click **🔑 Key Icon** (purple)
4. Toggle "Enable Self-Service Access" **ON**
5. ✅ **Email and password are AUTO-GENERATED**
6. Copy credentials and send to business owner

#### **Reset Password:**
1. Go to **Super Admin → Businesses**
2. Click **🔑 Key Icon** (purple)
3. Scroll to **"🔄 Reset Owner Password"** section
4. Click "Generate" OR type new password
5. Click "Update Password"
6. Copy and send to business owner

**IMPORTANT**: The business contact email in "Edit Business Data" is NOT for login - it's just contact info!

---

### **For STAFF MEMBERS:**

#### **Create Staff Account:**
1. Go to **Business Admin → Staff**
2. Click "Add Staff"
3. Fill in name and email
4. **Password field**: Enter password OR click "Generate Password"
5. Click "Add Staff"
6. ✅ **Credentials shown in success modal**
7. Copy and send to staff member

#### **Reset Staff Password:**
1. Go to **Business Admin → Staff**
2. Click **👤 Edit Icon** (UserCog)
3. Scroll to **"Reset Password (Optional)"** section
4. Click "Generate New Password" OR type new password
5. Click "Update Staff"
6. ✅ **New password shown in success modal**
7. Copy and send to staff member

---

## 📋 Quick Reference Table

| Account Type | Where to Create | Password Location | Login Email Format |
|--------------|----------------|-------------------|-------------------|
| **Business Owner** | Super Admin → Businesses → 🔑 Key Icon | Self-Service Modal | `owner@{slug}.com` |
| **Staff Member** | Business Admin → Staff → Add Staff | Creation/Edit Form | Any email |
| **Super Admin** | Manual DB setup | N/A | Any email |

---

## 🎯 Common Scenarios

### **Scenario: New Business Setup**
1. Create business (Edit icon - business info only)
2. Enable self-service (Key icon - creates login)
3. Send owner credentials
4. Owner logs in and adds staff

### **Scenario: Add Staff (as Business Owner)**
1. Login as business owner
2. Go to Staff page
3. Add staff with email + password
4. Send credentials to staff
5. Staff can now login

### **Scenario: Forgot Password**
- **Business Owner**: Super admin uses Key icon → Reset Password
- **Staff**: Business admin edits staff → Reset Password section

---

## ⚠️ Important Notes

1. **Business Contact Email ≠ Login Email**
   - Contact email in "Edit Business Data" is just for records
   - Login email is `owner@{slug}.com` (set in Self-Service)

2. **Two Separate Buttons for Business Management**:
   - ✏️ **Blue Edit Icon**: Edit business info (name, phone, logo, etc.)
   - 🔑 **Purple Key Icon**: Manage login access and passwords

3. **Password Visibility**:
   - Passwords shown ONLY during creation/reset
   - Can't retrieve old passwords
   - Must generate new password to reset

4. **Account Hierarchy**:
   ```
   Super Admin (manages everything)
     └── Business Owner (manages their business)
           └── Staff (can scan QR codes, lookup customers)
   ```

---

## 🚀 Step-by-Step: Complete Business Setup

### **Step 1: Create Business Entity**
1. Super Admin → Businesses → "Add Business"
2. Fill in: Name, Slug, Email (contact), Phone, Logo, Brand Color
3. Click "Create"
4. ✅ Business created (but no login yet!)

### **Step 2: Enable Login for Business Owner**
1. Find the business in list
2. Click **🔑 Key Icon** (purple)
3. Toggle "Enable Self-Service Access" **ON**
4. ✅ Auto-generates:
   - Email: `owner@coffee-shop-123.com`
   - Password: Random 12-char password
5. **Copy both** and save them!

### **Step 3: Send Credentials**
1. Click "Copy All Credentials" button
2. Send via email/messaging to business owner
3. Tell them to login at your platform URL

### **Step 4: Business Owner Adds Staff**
1. Business owner logs in
2. Goes to Staff page
3. Clicks "Add Staff"
4. Enters staff email and generates password
5. Sends credentials to staff member

---

## 🆘 Troubleshooting

**Q: I can't find the password field when editing business!**
- A: Password is NOT in "Edit Business Data" modal
- Use the **🔑 Key Icon** (purple) for password management

**Q: Where do I set the business owner's email?**
- A: It's auto-generated as `owner@{slug}.com`
- Can't be customized (ensures uniqueness)

**Q: Can I change the business owner's login email?**
- A: Not directly. You would need to:
  1. Disable self-service
  2. Change the business slug
  3. Re-enable self-service (generates new email)

**Q: Staff member forgot password - how to reset?**
- A: Business admin edits staff → Reset Password section

**Q: Business owner forgot password - how to reset?**
- A: Super admin → Key icon → Reset Owner Password section

---

**Last Updated**: June 16, 2026
