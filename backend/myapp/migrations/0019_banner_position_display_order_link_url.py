from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0018_productvariantimage'),
    ]

    operations = [
        migrations.AddField(
            model_name='banner',
            name='display_order',
            field=models.PositiveIntegerField(default=0, help_text='Sort order within its position'),
        ),
        migrations.AddField(
            model_name='banner',
            name='link_url',
            field=models.CharField(blank=True, help_text='Optional click-through URL', max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='banner',
            name='position',
            field=models.CharField(
                choices=[('left', 'Left'), ('right', 'Right')],
                default='left',
                help_text='Which promo slot this banner appears in',
                max_length=10,
            ),
        ),
        migrations.AlterModelOptions(
            name='banner',
            options={'ordering': ['position', 'display_order', 'id']},
        ),
    ]
