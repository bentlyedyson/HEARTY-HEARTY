import pandas as pd
from sys import argv, stdout
from json import dumps, JSONEncoder
from ast import literal_eval
from numpy import integer, floating, ndarray, bool_

file = argv[1]
df = pd.read_csv("ptbxl_database.csv", index_col="filename_lr")
scp_df = pd.read_csv("scp_statements.csv", index_col=0)

# Transforms into dictoinary object
res = df.loc[file].to_dict()
res["scp_codes"] = literal_eval(res["scp_codes"])

new_scp_codes = {}
super_diag = []
for x, y in res["scp_codes"].items():
  # Fills with proper scp statements
  new_scp_codes[x] = {
    **scp_df.loc[x],
    "likelihood": y
  }
  # Gets superdiagnostic
  if y >= 100.0 and scp_df.loc[x].diagnostic == 1.0:
    super_diag.append(x)
  
res["scp_codes"] = new_scp_codes
res["super_diag"] = super_diag

# Encode JSON so numpy types can be accepted
class NpEncoder(JSONEncoder):
  def default(self, obj):
    if isinstance(obj, integer):
      return int(obj)
    if isinstance(obj, floating):
      return float(obj)
    if isinstance(obj, ndarray):
      return obj.tolist()
    if isinstance(obj, bool_):
      return bool(obj)
    return super(NpEncoder, self).default(obj)

# Prints out the files
stdout.write(dumps(res, separators=(',', ':'), cls=NpEncoder).replace("NaN", "\"\""))
stdout.flush()