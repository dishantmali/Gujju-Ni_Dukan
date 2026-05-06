from django.db import migrations
import django_resized.forms


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0015_productimage'),
    ]

    operations = [
        migrations.AddField(
            model_name='productvariant',
            name='image',
            field=django_resized.forms.ResizedImageField(blank=True, crop=['middle', 'center'], force_format='JPEG', null=True, quality=75, size=[800, 1000], upload_to='product_variant_images/'),
        ),
    ]
