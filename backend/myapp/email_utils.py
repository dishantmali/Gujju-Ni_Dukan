from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

import threading

def send_html_email(subject, recipient_email, html_content, text_content=""):
    """
    Core helper to send a beautifully styled HTML email asynchronously in a background thread.
    Prevents network delays/timeouts on SMTP connections from blocking HTTP responses.
    """
    def _send():
        try:
            send_mail(
                subject=subject,
                message=text_content,
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[recipient_email],
                html_message=html_content,
                fail_silently=False,
            )
            print(f"[SMTP EMAIL SUCCESS] Sent email '{subject}' to {recipient_email}")
        except Exception as e:
            print(f"[SMTP EMAIL ERROR] Failed to send email '{subject}' to {recipient_email}. Error: {e}")

    thread = threading.Thread(target=_send)
    thread.start()
    return True

# Base visual template wrapping all emails for visual consistency and premium look
def get_base_template(content_html, title_text):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title_text}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #FFFBEB;
                color: #374151;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }}
            .wrapper {{
                width: 100%;
                background-color: #FFFBEB;
                padding: 40px 20px;
                box-sizing: border-box;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #FFFFFF;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                border: 1px solid #FEF3C7;
            }}
            .header {{
                background-color: #D97706;
                padding: 32px;
                text-align: center;
            }}
            .logo-text {{
                font-size: 26px;
                font-weight: 800;
                color: #FFFFFF;
                margin: 0;
                letter-spacing: 1px;
            }}
            .content {{
                padding: 40px 32px;
                line-height: 1.6;
            }}
            .footer {{
                background-color: #F9FAFB;
                padding: 24px 32px;
                text-align: center;
                border-top: 1px solid #E5E7EB;
                font-size: 13px;
                color: #9CA3AF;
            }}
            .btn {{
                display: inline-block;
                background-color: #D97706;
                color: #FFFFFF !important;
                text-decoration: none;
                padding: 12px 28px;
                border-radius: 8px;
                font-weight: 600;
                margin-top: 20px;
            }}
            .divider {{
                height: 1px;
                background-color: #E5E7EB;
                margin: 24px 0;
            }}
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="container">
                <div class="header">
                    <h1 class="logo-text">GUJJU NI DUKAN</h1>
                </div>
                <div class="content">
                    {content_html}
                </div>
                <div class="footer">
                    <p>&copy; {timezone.now().year} Gujju Ni Dukan. All rights reserved.</p>
                    <p>Discover authentic Gujarati crafts, spices, snacks, and traditions.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

def send_forgot_password_email(email, otp):
    subject = "Reset Your Password - Gujju Ni Dukan"
    content_html = f"""
        <h2 style="font-size: 20px; color: #1F2937; margin-top: 0;">Password Reset OTP</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your Gujju Ni Dukan account. Please use the following 6-digit verification code to reset your password:</p>
        <div style="background-color: #FEF3C7; border: 2px dashed #D97706; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0;">
            <span style="font-size: 36px; font-weight: 800; color: #B45309; letter-spacing: 8px; font-family: monospace;">{otp}</span>
        </div>
        <p style="color: #6B7280; font-size: 14px;">This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
    """
    return send_html_email(subject, email, get_base_template(content_html, "Reset Password"))

def send_vendor_approval_email(vendor, approved):
    subject = "Vendor Account Update - Gujju Ni Dukan"
    status_text = "Approved" if approved else "Suspended/Rejected"
    status_color = "#059669" if approved else "#DC2626"
    
    if approved:
        message_html = f"""
            <h2 style="font-size: 20px; color: #1F2937; margin-top: 0;">Congratulations!</h2>
            <p>Your vendor account for shop <strong>'{vendor.shop_name}'</strong> has been <strong style="color: {status_color};">APPROVED</strong> by our admin team.</p>
            <p>You can now log in to your dashboard to set up your catalog, manage subscription plans, and start listing products for buyers to discover.</p>
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://gujju-ni-dukan.vercel.app/login" class="btn">Go to Dashboard</a>
            </div>
        """
    else:
        message_html = f"""
            <h2 style="font-size: 20px; color: #1F2937; margin-top: 0;">Vendor Account Suspended</h2>
            <p>We regret to inform you that your vendor account for shop <strong>'{vendor.shop_name}'</strong> has been <strong style="color: {status_color};">SUSPENDED</strong> or <strong style="color: {status_color};">REJECTED</strong>.</p>
            <p>As a result, your shop profile is now deactivated and any listed products have been hidden from public search.</p>
            <p>If you believe this is in error, or if you wish to appeal this decision, please reach out to our admin support team.</p>
        """
    
    return send_html_email(subject, vendor.user.email, get_base_template(message_html, f"Vendor {status_text}"))

def send_product_approval_email(product, approved):
    subject = f"Product Status Update: {product.name} - Gujju Ni Dukan"
    status_text = "Approved" if approved else "Rejected"
    status_color = "#059669" if approved else "#DC2626"
    
    if approved:
        message_html = f"""
            <h2 style="font-size: 20px; color: #1F2937; margin-top: 0;">Product Live!</h2>
            <p>Hello,</p>
            <p>Your product <strong>'{product.name}'</strong> has been reviewed and <strong style="color: {status_color};">APPROVED</strong> by the admin team.</p>
            <p>It is now live on our marketplace and available for purchase by buyers!</p>
            <div style="background-color: #F9FAFB; padding: 16px; border-radius: 8px; margin-top: 20px; border: 1px solid #E5E7EB;">
                <strong>Product Details:</strong><br>
                Name: {product.name}<br>
                Price: ₹{product.price}<br>
                Category: {product.category.name if product.category else "Uncategorized"}
            </div>
        """
    else:
        message_html = f"""
            <h2 style="font-size: 20px; color: #1F2937; margin-top: 0;">Product Rejected</h2>
            <p>Hello,</p>
            <p>We wanted to let you know that your product listing for <strong>'{product.name}'</strong> was <strong style="color: {status_color};">REJECTED</strong> and archived by our admin team during review.</p>
            <p>Please check our merchant guidelines regarding pricing, product imagery, and descriptions. You can update and resubmit your product for approval from your vendor dashboard.</p>
        """
        
    return send_html_email(subject, product.vendor.user.email, get_base_template(message_html, f"Product {status_text}"))

def send_buyer_order_confirmation_email(order):
    subject = f"Order Confirmed #{order.id} - Gujju Ni Dukan"
    
    items_html = ""
    for item in order.items.all():
        variant_desc = f" ({item.variant_options_snapshot})" if item.variant_options_snapshot else ""
        item_total = item.price * item.quantity
        items_html += f"""
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                <div style="font-weight: 600; color: #1F2937;">{item.product_name_snapshot}{variant_desc}</div>
                <div style="font-size: 13px; color: #6B7280;">Vendor: {item.vendor_shop_snapshot}</div>
            </td>
            <td style="padding: 12px 0; text-align: center; border-bottom: 1px solid #E5E7EB; color: #4B5563;">x{item.quantity}</td>
            <td style="padding: 12px 0; text-align: right; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #1F2937;">₹{item_total}</td>
        </tr>
        """
        
    content_html = f"""
        <h2 style="font-size: 20px; color: #1F2937; margin-top: 0; text-align: center;">Thank you for your order!</h2>
        <p>Hello {order.user.name or order.user.username},</p>
        <p>Your order <strong>#{order.id}</strong> has been successfully placed and paid. The vendors have been notified to process and ship your items.</p>
        
        <div class="divider"></div>
        
        <h3 style="font-size: 16px; color: #1F2937; margin-bottom: 16px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="text-align: left; padding-bottom: 8px; color: #6B7280; font-size: 13px; border-bottom: 2px solid #E5E7EB;">ITEM</th>
                    <th style="text-align: center; padding-bottom: 8px; color: #6B7280; font-size: 13px; border-bottom: 2px solid #E5E7EB; width: 60px;">QTY</th>
                    <th style="text-align: right; padding-bottom: 8px; color: #6B7280; font-size: 13px; border-bottom: 2px solid #E5E7EB; width: 80px;">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>
        
        <table style="width: 100%; margin-top: 16px; line-height: 1.8;">
            {f'<tr><td style="color: #6B7280;">Discount:</td><td style="text-align: right; color: #DC2626; font-weight: 600;">-₹{order.discount_amount}</td></tr>' if order.discount_amount > 0 else ''}
            <tr>
                <td style="font-size: 18px; font-weight: 700; color: #1F2937; padding-top: 12px;">Total Paid:</td>
                <td style="text-align: right; font-size: 18px; font-weight: 700; color: #D97706; padding-top: 12px;">₹{order.total_price}</td>
            </tr>
        </table>
        
        <div class="divider"></div>
        
        <h3 style="font-size: 16px; color: #1F2937; margin-bottom: 8px;">Delivery Details</h3>
        <p style="margin: 0; line-height: 1.5; color: #4B5563;">
            <strong>Shipping Address:</strong><br>
            {order.address}
        </p>
        <p style="margin: 8px 0 0 0; color: #4B5563;">
            <strong>Phone:</strong> {order.phone}
        </p>
    """
    return send_html_email(subject, order.user.email, get_base_template(content_html, "Order Confirmation"))

def send_order_item_tracking_email(order_item, status):
    subject = f"Order Status Updated: {order_item.product_name_snapshot} - #{order_item.order.id}"
    status_label = status.capitalize()
    
    status_emoji = "📦"
    if status == 'confirmed':
        status_emoji = "✅"
    elif status == 'shipped':
        status_emoji = "🚚"
    elif status == 'delivered':
        status_emoji = "🎉"
    elif status == 'cancelled':
        status_emoji = "❌"
        
    status_colors = {
        'pending': '#F59E0B',
        'confirmed': '#059669',
        'shipped': '#3B82F6',
        'delivered': '#10B981',
        'cancelled': '#DC2626'
    }
    color = status_colors.get(status, '#374151')
    
    content_html = f"""
        <h2 style="font-size: 20px; color: #1F2937; margin-top: 0; text-align: center;">Order Update</h2>
        <p>Hello {order_item.order.user.name or order_item.order.user.username},</p>
        <p>An item from your order <strong>#{order_item.order.id}</strong> has been updated by the vendor:</p>
        
        <div style="background-color: #F3F4F6; border-left: 4px solid {color}; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <div style="font-size: 24px; font-weight: 700; color: {color}; margin-bottom: 8px;">
                {status_emoji} {status_label}
            </div>
            <p style="margin: 0; font-weight: 600; color: #1F2937;">{order_item.product_name_snapshot}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #6B7280;">Quantity: {order_item.quantity} | Vendor: {order_item.vendor_shop_snapshot}</p>
        </div>
        
        <p>You can track all items in this order directly on your dashboard.</p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://gujju-ni-dukan.vercel.app/profile" class="btn">View Orders</a>
        </div>
    """
    return send_html_email(subject, order_item.order.user.email, get_base_template(content_html, f"Item {status_label}"))

def send_vendor_order_notification_email(vendor, items, order):
    subject = f"New Order Received #{order.id} - Gujju Ni Dukan"
    
    items_html = ""
    for item in items:
        variant_desc = f" ({item.variant_options_snapshot})" if item.variant_options_snapshot else ""
        item_total = item.price * item.quantity
        items_html += f"""
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                <div style="font-weight: 600; color: #1F2937;">{item.product_name_snapshot}{variant_desc}</div>
            </td>
            <td style="padding: 12px 0; text-align: center; border-bottom: 1px solid #E5E7EB; color: #4B5563;">x{item.quantity}</td>
            <td style="padding: 12px 0; text-align: right; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #1F2937;">₹{item_total}</td>
        </tr>
        """
        
    content_html = f"""
        <h2 style="font-size: 20px; color: #1F2937; margin-top: 0; text-align: center;">New Order Notification!</h2>
        <p>Hello {vendor.shop_name},</p>
        <p>You have received a new order <strong>#{order.id}</strong> for your products. Please review the details below and prepare for shipment.</p>
        
        <div class="divider"></div>
        
        <h3 style="font-size: 16px; color: #1F2937; margin-bottom: 16px;">Ordered Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="text-align: left; padding-bottom: 8px; color: #6B7280; font-size: 13px; border-bottom: 2px solid #E5E7EB;">ITEM</th>
                    <th style="text-align: center; padding-bottom: 8px; color: #6B7280; font-size: 13px; border-bottom: 2px solid #E5E7EB; width: 60px;">QTY</th>
                    <th style="text-align: right; padding-bottom: 8px; color: #6B7280; font-size: 13px; border-bottom: 2px solid #E5E7EB; width: 80px;">TOTAL</th>
                </tr>
            </thead>
            <tbody>
                {items_html}
            </tbody>
        </table>
        
        <div class="divider"></div>
        
        <h3 style="font-size: 16px; color: #1F2937; margin-bottom: 8px;">Delivery Details</h3>
        <p style="margin: 0; line-height: 1.5; color: #4B5563;">
            <strong>Customer:</strong> {order.user.name or order.user.username}<br>
            <strong>Shipping Address:</strong><br>
            {order.address}
        </p>
        <p style="margin: 8px 0 0 0; color: #4B5563;">
            <strong>Phone:</strong> {order.phone}
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://gujju-ni-dukan.vercel.app/profile" class="btn">Go to Vendor Dashboard</a>
        </div>
    """
    return send_html_email(subject, vendor.user.email, get_base_template(content_html, "New Order Notification"))
