from django.db import migrations


def seed_frontend_categories(apps, schema_editor):
    Category = apps.get_model('myapp', 'Category')
    names = [
        "Groceries",
        "Snacks",
        "Pickles",
        "Spices",
        "Sweets",
        "Dry Fruits",
        "Handicrafts",
        "Clothing",
        "Pooja Items",
        "Home Decor",
    ]
    for name in names:
        Category.objects.get_or_create(name=name)


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0016_productvariant_image'),
    ]

    operations = [
        migrations.RunPython(seed_frontend_categories, migrations.RunPython.noop),
    ]
