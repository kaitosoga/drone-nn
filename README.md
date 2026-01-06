# AI Drone Races

#### meta = {  
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Fach: "IN29",  
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Author: "Kaito Soga",  
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Sprachen: "JS Client Side + Python Backend",  
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Titel: "AI Drone Battle",  
#### }


basically the structure:

the whole project described
implementation of drone physics (python)
drone ai (python)
training (python)
inference (python)
inference in tfjs
canvas map for the drones + user inputs
different tabs for login, account data (scores), leaderboard, and the game itself
backend logging of scores, names, passwds, leaderboard
another input option for the user, where they can drag around and edit state-space variables, operators, and floats, to create and save a simple pid and run it against the ai or themselves


## Projektbeschreibung,  Schritte der Implementierung:
Ich werde in einer 2D Umgebung mit Canvas eine Drone programmieren, die zwei Thrusters (Antriebe) besitzt, und realistischen physikalischen Eigenschaften unterliegt (Schwerkraft, Momentum, Geschwindigkeit, Beschleunigung, Rotation (-sgeschindigkeit)). Ein Spieler soll diese Drone bedienen können und damit gegen eine KI oder eine PID (simpler, manuell programmierter algorithmus) spielen. In der Spielumgebung soll eine Drone in möglichst wenig Zeit zum nächsten Checkpoint fliegen, und der Score soll berechnet und angezeigt werden. Es soll ausserdem verschiedene Levels geben, d.h., es wird unterschiedlich starke KIs geben. 


### 0. Drone mit Checkpoints (Python + PyTorch + PyGame) 
#### 0.1 Physik basierte Umgebung in Python
Um die KI zu trainieren, werde ich aus praktischen Gründen Python (NumPy + PyGame in .ipynb notebooks) benutzen, und dort im die physikalischen Eigenschaften testen, bevor ich sie in JS mit Canvas implementiere. Das hat zur Ursache, dass ich mich mit PyTorch besser auskenne als mit Tensorflow, welches es im Gegensatz zu PyTorch auch in JS als Library gibt. 


#### 0.2 Training
Die KI wird eine parametrische Funktion sein, dessen Parameter das Training optimieren wird. Ziel ist es, dass sie den State-Space (den Zustand der Drone und ihre Umgebung) als Input nimmt, und als Output die beiden (stetigen) Werte für die Thrusters gibt.  

Das bedeutet, dass die Loss Funktion (die den Verlust der KI berechnet) ... MSE, Adam, 8 inputs, gute layer sizes finden ...

Braucht labels: eine simple PID programmiert, die aus den inputs und dem optimalen vektor von (x_drone, y_drone) zu (x_checkpoint, y_checkpoint) zeigt.
Die Output dieser PID werden als Feedback signal für den Loss in Backpropagation fürs optimieren der Parameter der KI genutzt. Um das ganze auszubalansieren, werden ich einfach während dem Training die drone mit zufälligen eigenschaften (Ort, v, a, v_rot) initialisieren, und dann für ein paar frame laufen lassen, bis ich sie wieder neu initialisiere, so dass die KI lernt, kurze Episoden zu lernen. Das hat auch zur folge, dass die KI implizit aus vergangenen Frames lernt, um "vorrauszudenken", wobei das noch besser mit eine Reinforcement Policy gehen würde. Diese werde ich nur einbauen sollte die Zeit noch reichen, und ich noch eine bessere KI brauchen / wollen.

Diese Parameter werde ich aus praktischen Gründen in Python in Jupyter Notebooks (.ipynb) mit PyTorch trainieren. Die Inferenz, welche deutlich einfacher zu implementieren ist als das Training, werde ich die gespeicherten Parameter in JS Tensorflow (TFJS) implementieren.  


#### 0.3 Inferenz
Um das ganze beim Debuggen und Fine-tunen der KI schon zu testen, habe ich das Game in PyGame (Python) visualisert, werde dies aber in Canvas (JS) richtig finalisieren. Dazu werde ich in TFJS auch die KI programmieren, aber nur die Infereznz, und nicht das Training, was es um einiges simpler macht.

Für die Inferenz ...

Das Game selbst wird im nächsten Abschnitt genauer beschrieben.


### 1. Game Design in JS + Canvas
#### 1.1
Im front-end werde ich eine Umgebung für eine 2D Drone erstellen in JS (Three.js oder Canvas).  

Mit dem Ziel zu zufällig generierten Checkpoints zu fliegen sollen Users versuchen in Limitierter Zeit so viele Checkpoints wie möglich zu sammeln. Die Anzahl dieser Checkpoints in bestimmter Zeit definieren den Score.


#### 1.2
Anstatt, dass die Drone sich in einem fixen Feld bewegt, soll die Drone vom Spieler immer fix im Zentrum vom screen bleiben, wobei sich der Hintergrund bewegt, d.h., das "Spielfeld" ist grösser als nur der Screen selbst. Das Ziel ist es, diese Spielfeld zwar simpel, aber automatisch zu generieren, sodass sich das Feld beliebig weit ausbreiten kann. Es mag soit Hindernisse geben, durch die die Dronen sich bewegen müssen, diese sollen aber mit einem angemessnene Algorithmus automatisch generiert werden, sodass ich nicht die gesamte Map manuell gestalten muss, und damit das Spiel interessant und variierend bleibt.



#### 1.3




#### 1.4





### 3. User Inputs
Users sollen die Drone steuern können, in dem sie jeweils die 2 Thrusts an/aus machen (Frequenz von Clicks = Intensität von Thrusters).

Zusätzlich sollen Users gegen eine KI spielen, d.h., Users müssen versuchen schneller von Checkpoint zu Checkpoint zu fliegen als die von KI kontrollierte Drone. Die KI wird in Python (PyTorch + .ipynb) trainiert werden, die architectur für Inference aber in JS für die Client-Side implementiert. Die Architektur wir self-supervised sein, nämlich eine Policy Optimisation (ein Feedforward Neural Network (FFN) wird lokale Sequenzen von Frames in der sich Bewegenden Drone lernen, wobei die Outputs dieses FFNs die Thruster Intensitäten (x, y) bestimmt, und der Input der State-Vekctor ist.).




### 3. Back-End logging von Scores 
Im back-end werde ich Daten von Scores speichern, mit dem Ziel diese auf einem Leaderboard anzuzeigen.
Genaugenommen, werde ich ein Python Skript entweder mit Flask oder über einen Web-Socket auf meinem Server (Homeserver auf Raspberry Pi) laufen lassen, welches automatisch die Scores von Usern Speichert, und diese auf ein Leaderboard auf der Webseite veröffentlich, d.h., Spieler müssen zu Beginn einen Username wählen, sofern dieser noch verfügbar ist. Da ich nicht erwarte dafür noch viel Zeit zu haben, werde ich kein Passwort verlange oder mit SQL arbeiten, sondern lediglcih die verfügbaren Username in einem .txt oder .csv file auf dem Server speichern, auf das Python zugreift. 



### 4. Bearbeitbares "Bauset" für Spieler
Sollte die Zeit noch reichen werde ich, um das Game besonders interaktiv und interessant zu machen, ein Interface implementieren das es Users erlaubt, selbst ein PID zu programmieren, um diese gegen meine KI oder sich selbst (oder beide) spielen zu lassen.
