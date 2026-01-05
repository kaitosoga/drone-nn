# Projektskizze

#### meta = {  
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Fach: "IN29",  
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Author: "Kaito Soga",  
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Sprachen: "JS Client Side + Python Backend",  
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Titel: "AI Drone Battle",  
#### }


## Projektbeschreibung + Schritte der Implementierung:
Mein Ziel ist es, mindestens die ersten 3 Schritte zu implementieren.


### 0. Drone im Front-End:
Im front-end werde ich eine Umgebung für eine 2D Drone erstellen in JS (Three.js oder Canvas).  
Diese Drone soll sich zwar simpel in zwei Dimensionen verhalten, aber trotzdem realistischen physikalischen Eigenschaften unterliegen. Users sollen die Drone steuern können, in dem sie jeweils die 2 Thrusts an/aus machen (Frequenz von Clicks = Intensität von Thrusters).

### 1. Checkpoint + Games:
Mit dem Ziel zu zufällig generierten Checkpoints zu fliegen sollen Users versuchen in Limitierter Zeit so viele Checkpoints wie möglich zu sammeln. Die Anzahl dieser Checkpoints in bestimmter Zeit definieren den Score.

### 2. KI Drone als Gegner:
Zusätzlich sollen Users gegen eine KI spielen, d.h., Users müssen versuchen schneller von Checkpoint zu Checkpoint zu fliegen als die von KI kontrollierte Drone. Die KI wird in Python (PyTorch + .ipynb) trainiert werden, die architectur für Inference aber in JS für die Client-Side implementiert. Die Architektur wir self-supervised sein, nämlich eine Policy Optimisation (ein Feedforward Neural Network (FFN) wird lokale Sequenzen von Frames in der sich Bewegenden Drone lernen, wobei die Outputs dieses FFNs die Thruster Intensitäten (x, y) bestimmt, und der Input der State-Vekctor ist.).

### 3. Back-End logging von Scores:
Im back-end werde ich Daten von Scores speichern, mit dem Ziel diese auf einem Leaderboard anzuzeigen.

### 4. Bearbeitbares "Bauset" für 
Sollte die Zeit noch reichen werde ich, um das Game besonders interaktiv und interessant zu machen, ein Interface implementieren das es Users erlaubt, selbst ein PID zu programmieren, um diese gegen meine KI oder sich selbst (oder beide) spielen zu lassen.
