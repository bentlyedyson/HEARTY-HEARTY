import pickle
from sys import argv, stdout
from json import dumps
from ast import literal_eval
import numpy as np
import warnings

def apply_standardizer(X, ss):
  X = np.array([X])
  x_shape = X.shape
  X_tmp = ss.transform(X.flatten()[:,np.newaxis]).reshape(x_shape)
  return np.array(X_tmp[0])

with warnings.catch_warnings():
  warnings.filterwarnings(
    "ignore",
    
  )
  model = pickle.load(open("model.pkl", "rb"))
  standardizer = pickle.load(open("standardizer.pkl", "rb"))

  with open(argv[1], "rt") as file:
    stdd = apply_standardizer(np.array(literal_eval(file.read())), standardizer)
    pred = model.predict(np.array([stdd]))
    
    stdout.write(dumps(pred[0].tolist(), separators=(',', ':')))
    stdout.flush()
