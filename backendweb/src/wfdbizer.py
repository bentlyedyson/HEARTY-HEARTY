"""Simple script to read wfdb file and outputs it as json"""
from wfdb import rdsamp
from json import dumps
from sys import argv, stdout

file_dir = argv[1]
stdout.write(dumps(rdsamp(file_dir)[0].T.tolist(), separators=(',', ':')))
stdout.flush()