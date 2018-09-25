from django.shortcuts import render
from django.http import HttpRequest
from django.template import RequestContext
from django.http import *
from django.shortcuts import render_to_response,redirect
from django.template import RequestContext

from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
import os
dir= os.path.dirname(__file__)
# Create your views here.
def admin_login(request):
    logout(request)
    username = password = ''
    if request.POST:
        username = request.POST['username']
        password = request.POST['password']

        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                return HttpResponseRedirect('/main/')
    
    return render(
        request,
        dir+'/templates/login.html',
        {
            'title':'Home Page',
            
        }
    )