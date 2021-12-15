import tensorflow as tf
from efficientnet_lite import EfficientNetLiteB0

def efficient_net(length):
  base = EfficientNetLiteB0(
    input_shape=(100, 120, 1),
    # input_tensor=tf.constant([1000, 120, 3]),
    weights = None,
    include_top=False,
    pooling="avg",
  )
  
  model = tf.keras.Sequential([
    base,
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(length, activation="sigmoid") # We want a classification
  ])
  
  model.compile(
    optimizer=tf.keras.optimizers.Adam(),
    loss=tf.keras.losses.CategoricalCrossentropy(from_logits=False),
    metrics=['accuracy']
  )
  
  return model