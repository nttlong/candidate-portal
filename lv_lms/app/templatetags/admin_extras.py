from django import template
import json
import numpy
register = template.Library()
def test(context):
    return "OK duoc roi '"+context+"'"
def to_json(data):
    list=numpy.asarray(data)
    return json.dumps(list)

register.filter("test",test)
register.filter("to_json",to_json)
