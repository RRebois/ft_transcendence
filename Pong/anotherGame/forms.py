from django import forms

from .game import max_quantity

class   QuantityForm(forms.Form):
    quantity = forms.NumberInput(attrs={
            'id': 'quantityInput',
            'name': 'quantity',
            'type' : 'range',
            'min': '0',
            'max': max_quantity,
            'required': True
        })