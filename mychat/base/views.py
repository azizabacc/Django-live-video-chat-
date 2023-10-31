from django.shortcuts import render
from agora_token_builder import RtcTokenBuilder
from django.http import JsonResponse
from dotenv import load_dotenv
from .models import RoomMember
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist

import os
import json
import random
import time 

load_dotenv()  # take environment variables from .env.
   # Create your views here.
def lobby(request):
    return render(request, 'base/lobby.html')

def room(request):
    return render(request, 'base/room.html')

    #Build token with uid
def getToken(request):
    appId = os.getenv('appId')
    appCertificate = os.getenv('appCertificate')
    channelName = request.GET.get('channel')
    uid = random.randint(1,230) #to remplace with user id of the DB
    experationTimeInSeconds = 3600 * 24
    currentTimeStamp = time.time()
    privilegeExpiredTs = experationTimeInSeconds + currentTimeStamp
    role = 1 #if 1 => host if 2 => guest : does not matter for the moment because no notion of authentification
    
    token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelName, uid, role, privilegeExpiredTs)
    return JsonResponse({'token':token, 'uid':uid}, safe=False) #safe=False :  receive any Python Data Type.



@csrf_exempt #exemt ssrf token
def createMember(request):
    data =json.loads(request.body.decode('utf-8'))

    member, created = RoomMember.objects.get_or_create(
    name = data['name'],
    uid = data['UID'],
    room_name = data['room_name']
    )
    return JsonResponse({'name':data['name']}, safe=False) 

def getMember(request):
    uid = request.GET.get('uid')
    room_name = request.GET.get('room_name')

    try:
        member = RoomMember.objects.get(uid=uid, room_name=room_name)
        name = member.name
        return JsonResponse({'name': name}, safe=False)
    except ObjectDoesNotExist:
        # member not found
        return JsonResponse({'error': 'member not found'}, status=404)

@csrf_exempt #exempt ssrf token
def deleteMember(request):
    data =json.loads(request.body)
    member = RoomMember.objects.get(name=data['name'], uid=data['UID'], room_name=data['room_name'])
    member.delete()
    return JsonResponse('Member was deleted', safe=False) 
