from django.contrib import admin

from .models import (
    Patient,
    Medicine,
    Schedule,
    Adherence
)

admin.site.register(Patient)
admin.site.register(Medicine)
admin.site.register(Schedule)
admin.site.register(Adherence)