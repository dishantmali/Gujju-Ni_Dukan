from django.db import migrations, models
import django.db.models.deletion
import django_resized.forms


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0017_seed_frontend_categories'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductVariantImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', django_resized.forms.ResizedImageField(crop=['middle', 'center'], force_format='JPEG', quality=75, size=[800, 1000], upload_to='product_variant_images/')),
                ('variant', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='myapp.productvariant')),
            ],
            options={
                'ordering': ['id'],
            },
        ),
    ]
