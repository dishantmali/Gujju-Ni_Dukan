# Product variants: SKU rows + CartItem/OrderItem FK

import django.db.models.deletion
from django.db import migrations, models


def seed_variants(apps, schema_editor):
    Product = apps.get_model('myapp', 'Product')
    ProductVariant = apps.get_model('myapp', 'ProductVariant')
    for p in Product.objects.iterator():
        ProductVariant.objects.create(
            product=p,
            sku='',
            price=p.price,
            stock_quantity=p.stock_quantity or 0,
            option_values={},
        )


def backfill_cart_variants(apps, schema_editor):
    CartItem = apps.get_model('myapp', 'CartItem')
    ProductVariant = apps.get_model('myapp', 'ProductVariant')
    mapping = {}
    for pv in ProductVariant.objects.order_by('product_id', 'id').iterator():
        if pv.product_id not in mapping:
            mapping[pv.product_id] = pv.id
    for ci in CartItem.objects.iterator():
        vid = mapping.get(ci.product_id)
        if vid:
            ci.product_variant_id = vid
            ci.save(update_fields=['product_variant_id'])


def backfill_order_variants(apps, schema_editor):
    OrderItem = apps.get_model('myapp', 'OrderItem')
    ProductVariant = apps.get_model('myapp', 'ProductVariant')
    mapping = {}
    for pv in ProductVariant.objects.order_by('product_id', 'id').iterator():
        if pv.product_id not in mapping:
            mapping[pv.product_id] = pv.id
    for oi in OrderItem.objects.iterator():
        vid = mapping.get(oi.product_id)
        if vid:
            oi.product_variant_id = vid
            oi.save(update_fields=['product_variant_id'])


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0013_address_userprofile'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductVariant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('sku', models.CharField(blank=True, default='', max_length=100)),
                ('price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('stock_quantity', models.PositiveIntegerField(default=0)),
                ('option_values', models.JSONField(default=dict)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='variants', to='myapp.product')),
            ],
            options={
                'ordering': ['id'],
            },
        ),
        migrations.RunPython(seed_variants, migrations.RunPython.noop),
        migrations.AlterUniqueTogether(
            name='cartitem',
            unique_together=set(),
        ),
        migrations.AddField(
            model_name='cartitem',
            name='product_variant',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='cart_items',
                to='myapp.productvariant',
            ),
        ),
        migrations.RunPython(backfill_cart_variants, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='cartitem',
            name='product_variant',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='cart_items',
                to='myapp.productvariant',
            ),
        ),
        migrations.AlterUniqueTogether(
            name='cartitem',
            unique_together={('cart', 'product_variant')},
        ),
        migrations.AlterUniqueTogether(
            name='orderitem',
            unique_together=set(),
        ),
        migrations.AddField(
            model_name='orderitem',
            name='product_variant',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='order_items',
                to='myapp.productvariant',
            ),
        ),
        migrations.AddField(
            model_name='orderitem',
            name='variant_options_snapshot',
            field=models.CharField(blank=True, max_length=512, null=True),
        ),
        migrations.RunPython(backfill_order_variants, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='orderitem',
            name='product_variant',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='order_items',
                to='myapp.productvariant',
            ),
        ),
        migrations.AlterUniqueTogether(
            name='orderitem',
            unique_together={('order', 'product_variant')},
        ),
    ]
