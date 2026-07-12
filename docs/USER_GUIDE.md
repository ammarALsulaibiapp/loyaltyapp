# LoyaltyPass User Guide

Complete guide for using the LoyaltyPass platform across all user roles.

## Table of Contents

1. [Super Admin Guide](#super-admin)
2. [Business Admin Guide](#business-admin)
3. [Staff Guide](#staff)
4. [Customer Experience](#customer-experience)

---

## Super Admin

Super Admin is the platform owner who manages all businesses and subscriptions.

### Dashboard

View platform-wide analytics:
- Total businesses
- Active/expired subscriptions
- Total customers across all businesses
- Platform revenue
- Monthly trends

### Managing Businesses

#### Create Business
1. Go to "Businesses"
2. Click "Add Business"
3. Fill in:
   - Business name
   - Slug (unique URL-friendly identifier)
   - Contact information
   - Brand color
4. Upload logo (optional)
5. Click "Create"

#### Suspend Business
1. Find business in list
2. Click pause icon
3. Confirm suspension
4. Business will lose access immediately

#### Delete Business
⚠️ **Careful!** This permanently deletes all business data.
1. Find business
2. Click delete icon
3. Type business name to confirm
4. All customer data, visits, rewards will be deleted

### Managing Subscriptions

#### Create Subscription
1. Select business
2. Choose plan:
   - **Starter**: 500 customers, 1 staff
   - **Business**: 5000 customers, 10 staff
   - **Premium**: Unlimited
3. Set dates:
   - Start date
   - Expiry date
   - Auto-renewal (optional)
4. Set pricing

#### Handle Expired Subscriptions
- Business gets restricted access
- Can view data but not add new customers
- Send renewal notice
- Update expiry date when paid

### Invoicing

#### Generate Invoice
1. Go to "Invoices"
2. Click "Generate Invoice"
3. Select business
4. Enter amount
5. Set issue and due dates
6. Invoice number auto-generated

#### Mark as Paid
1. Find invoice
2. Click checkmark icon
3. Paid date recorded automatically

### Platform Settings

Configure global settings:
- Default currency
- Default language
- Allow signups (on/off)
- Maintenance mode

---

## Business Admin

Business Admin manages their own business, customers, loyalty programs, and staff.

### Dashboard

Your business overview:
- Total customers
- Visits today
- New customers this week
- Rewards redeemed
- Active loyalty programs
- Weekly visit trends
- Customer growth chart
- Recent activity feed

### Customer Management

#### Add Customer

**Phone-based system** - No password needed!

1. Go to "Customers"
2. Click "Add Customer"
3. Enter phone number (required)
4. Optional information:
   - Full name
   - Birthday
   - Gender
   - Notes
5. Click "Create"

Customer immediately gets:
- Unique QR code
- Bronze membership tier
- 0 points to start
- Digital wallet card (if configured)

#### Search Customers

Use the search bar to find customers by:
- Phone number
- Name

#### View Customer Details

Click "View" icon to see:
- Contact information
- Total visits
- Total points
- Total spent
- Membership tier
- Member since date
- Available rewards
- Visit history
- Redemption history

#### Customer Tiers

Automatically upgraded based on activity:
- **Bronze**: New customers (0-4 visits)
- **Silver**: Regular customers (5-14 visits)
- **Gold**: Loyal customers (15-29 visits)
- **VIP**: Best customers (30+ visits)

### Loyalty Programs

#### Program Types

1. **Visit-Based**
   - Example: Buy 5 coffees, get 1 free
   - Automatically tracks visits
   - Unlocks reward at target

2. **Points-Based**
   - Example: 1 OMR = 1 point, 100 points = reward
   - Earned on purchases
   - Flexible redemption

3. **Stamp Card**
   - Example: Collect 8 stamps, get reward
   - Digital stamp collection
   - Visual progress tracking

4. **Cashback**
   - Example: 5% back on all purchases
   - Automatic calculation
   - Added as points/credit

#### Create Loyalty Program

1. Go to "Loyalty Programs"
2. Click "Create Program"
3. Choose type
4. Configure rules:
   - **Visit-Based**: Set required visits
   - **Points-Based**: Set points ratio and reward threshold
   - **Stamp Card**: Set required stamps
   - **Cashback**: Set percentage
5. Define reward:
   - Reward name (e.g., "Free Coffee")
   - Description
   - Value (optional)
6. Click "Create"

#### Automatic Reward System

The system automatically:
- Tracks customer progress
- Calculates points/visits/stamps
- Unlocks rewards when threshold met
- Notifies customer (if enabled)
- Shows reward in customer profile
- Allows staff to redeem

**No manual calculations needed!**

### Rewards Management

#### View Available Rewards

See all unlocked rewards waiting to be redeemed:
- Customer name/phone
- Reward name
- Loyalty program
- Date earned
- Quick redeem button

#### View Redemption History

Track all redeemed rewards:
- What was redeemed
- Which customer
- Which staff member redeemed it
- Date/time
- Loyalty program

### Staff Management

#### Add Staff Member

1. Go to "Staff"
2. Click "Add Staff"
3. Enter:
   - Full name
   - Email (for login)
   - Phone number
4. Click "Add"

Staff receives email with login credentials.

#### Staff Permissions

Staff can ONLY:
- Search customers by phone
- Add visits
- Add points
- Redeem rewards

Staff CANNOT:
- View billing
- Manage other staff
- Edit loyalty programs
- Access business settings
- Delete customers

### Reports

Generate business analytics:

1. **Customer Activity Report**
   - Visit patterns
   - Spending trends
   - Most active customers

2. **Rewards Summary**
   - Rewards earned vs redeemed
   - Most popular rewards
   - Redemption rate

3. **Customer Retention**
   - New vs returning customers
   - Churn analysis
   - Lifetime value

4. **Revenue Report**
   - Sales trends
   - Average transaction
   - Revenue by period

Export formats:
- PDF (printable)
- Excel (analysis)
- CSV (import elsewhere)

### Settings

#### General Settings
- Business name
- Contact information
- Address
- Description

#### Branding
- Brand color (used in wallet cards)
- Business logo (500x500px recommended)

#### Notifications

**Enable/Disable Channels:**
- ☑️ SMS Notifications
- ☑️ WhatsApp Notifications
- ☑️ Email Notifications

**Choose Events:**
- Customer created
- Reward earned
- Reward redeemed
- Birthday reward
- Membership upgrade

**Note:** Notification providers must be configured. System works fine with all disabled.

---

## Staff

Staff members have limited access focused on customer interactions.

### Dashboard

Simple view showing:
- Quick action buttons
- Today's activity stats
- Usage instructions

### Customer Lookup

#### The Core Staff Workflow

1. Customer enters business
2. Staff asks: **"What is your phone number?"**
3. Staff enters phone in lookup
4. System shows customer profile

**If customer exists:**
- See full profile
- View available rewards
- Add visit
- Redeem rewards

**If customer NOT found:**
- System says "Customer not found"
- Staff asks Business Admin to create account
- Staff cannot create customers

#### Add Visit

1. Find customer via phone lookup
2. Click "Add Visit"
3. Enter:
   - Amount spent (auto-calculates points)
   - Select loyalty program (optional)
4. Click "Add Visit"

System automatically:
- Increments visit count
- Adds points (1:1 ratio)
- Updates total spent
- Checks for reward unlock
- Updates wallet card

#### Redeem Reward

1. Find customer
2. View "Available Rewards" section
3. Click "Redeem" on reward
4. Confirm redemption
5. System records:
   - Who redeemed (your staff ID)
   - When redeemed
   - Which reward
   - Marks reward as used

---

## Customer Experience

### How Customers Use the System

**Important:** Customers do NOT create accounts or login!

### The Customer Journey

1. **Visit Business First Time**
   - Staff asks for phone number
   - Business Admin creates account
   - Customer receives QR code (optional)

2. **Add to Wallet (Optional)**
   - Scan QR code or click link
   - Add to Apple/Google Wallet
   - Card shows:
     - Business logo
     - Customer name
     - Points
     - Visits
     - Available rewards
     - QR code

3. **Return Visits**
   - Staff asks phone number
   - OR scan wallet QR code
   - Staff adds visit
   - Points increase automatically

4. **Earn Rewards**
   - System tracks progress automatically
   - Unlock reward when threshold met
   - Notification sent (if enabled)
   - See in wallet card

5. **Redeem Rewards**
   - Show wallet card or give phone
   - Staff sees available rewards
   - Staff redeems
   - Reward marked as used

### Wallet Card Features

#### Apple Wallet
- Auto-updates when data changes
- Lock screen access
- Location-based notifications (optional)
- Secure QR code

#### Google Wallet
- Real-time sync
- Quick access
- Material Design
- Secure QR code

### Privacy

Customer data:
- Stored securely in database
- Only visible to their business
- Not shared across businesses
- RLS (Row Level Security) enforced
- Phone number is primary identifier

---

## Best Practices

### For Businesses

1. **Keep it Simple**
   - Start with one loyalty program
   - Add more as you learn

2. **Train Staff Well**
   - Show them customer lookup
   - Practice adding visits
   - Practice redeeming rewards

3. **Communicate Value**
   - Tell customers about program
   - Display program details in store
   - Remind customers to join

4. **Monitor Analytics**
   - Check dashboard daily
   - Review reports weekly
   - Adjust programs based on data

5. **Reward Loyalty**
   - Make rewards valuable
   - Make them easy to earn
   - Celebrate milestones

### For Staff

1. **Always Ask for Phone**
   - Every customer, every visit
   - Consistent experience

2. **Be Enthusiastic**
   - Explain program benefits
   - Celebrate rewards earned
   - Make it exciting

3. **Keep it Fast**
   - Quick lookup
   - Fast visit recording
   - Smooth experience

### For Super Admins

1. **Monitor Subscriptions**
   - Check expirations weekly
   - Send renewal reminders
   - Follow up on payments

2. **Support Businesses**
   - Help with setup
   - Answer questions
   - Share best practices

3. **Track Platform Health**
   - Monitor active businesses
   - Track revenue trends
   - Plan capacity

---

## Troubleshooting

### "Customer not found"
- Verify phone number format
- Check with Business Admin
- Create customer first

### "Cannot add visit"
- Check subscription status
- Verify customer belongs to business
- Check internet connection

### "Reward not showing"
- Refresh customer profile
- Check loyalty program rules
- Verify visit count

### Wallet card not updating
- May take a few minutes
- Check notification settings
- Re-add card if needed

---

## Tips & Tricks

### Quick Customer Lookup
- Save frequent customer numbers
- Use QR scanner for speed
- Keep phone handy

### Bulk Operations
- Export customers to CSV
- Process offline
- Re-import if needed

### Marketing Integration
- Export customer list
- Send birthday offers
- Announce new programs

### Customization
- Match brand colors
- Use high-quality logo
- Professional photos

---

## Getting Help

If you need assistance:

1. Check this guide first
2. Review setup documentation
3. Check Supabase logs
4. Contact support

**Happy loyalty building! 🎉**
