# Projektskizze

#### meta = {  
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Fach: "IN29",  
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Author: "Kaito Soga",  
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Sprachen: "JS Client Side + Python Backend",  
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Titel: "AI Drone Battle",  
#### }


## Projektbeschreibung,  Schritte der Implementierung:
Ich werde eine in einer 2D Umgebung mit Canvas eine Drone programmieren, die zwei Thrusters (Antriebe) besitzt, und realistischen physikalischen Eigenschaften unterliegt (Schwerkraft, Momentum, Geschwindigkeit, Beschleunigung, Rotation (-sgeschindigkeit)). Ein Spieler soll diese Drone bedienen können und damit gegen eine KI oder eine PID (simpler, manuell programmierter algorithmus) spielen. In der Spielumgebung soll eine Drone in möglichst wenig Zeit zum nächsten Checkpoint fliegen, und der Score soll berechnet und angezeigt werden. Es soll ausserdem verschiedene Levels geben, d.h., es wird unterschiedlich starke KIs geben. 

### 0. Drone mit Checkpoints im Front-End (Canvas) 
#### 0.1 Physik basierte Umgebung in Python
Die KI wird eine parametrische Funktion sein, dessen Parameter das Training optimieren wird. Ziel ist es, dass sie den State-Space (den Zustand der Drone und ihre Umgebung) als Input nimmt, und als Output die beiden (stetigen) Werte für die Thrusters gibt.  

Das bedeutet, dass die Loss Funktion (die den Verlust der KI berechnet) ... 

Diese Parameter werde ich aus praktischen Gründen in Python in Jupyter Notebooks (.ipynb) mit PyTorch trainieren. Die Inferenz, welche deutlich einfacher zu implementieren ist als das Training, werde ich die gespeicherten Parameter in JS Tensorflow (JSTF) implementieren.  


#### 0.2 Training

#### 0.3 Inferenz

### 1. Game Design der Map 
#### 1.1
Im front-end werde ich eine Umgebung für eine 2D Drone erstellen in JS (Three.js oder Canvas).  

Mit dem Ziel zu zufällig generierten Checkpoints zu fliegen sollen Users versuchen in Limitierter Zeit so viele Checkpoints wie möglich zu sammeln. Die Anzahl dieser Checkpoints in bestimmter Zeit definieren den Score.

#### 1.1

#### 1.2

#### 1.3

### 2. KI Drone als Gegner (Inferenz in JSTF)
Zusätzlich sollen Users gegen eine KI spielen, d.h., Users müssen versuchen schneller von Checkpoint zu Checkpoint zu fliegen als die von KI kontrollierte Drone. Die KI wird in Python (PyTorch + .ipynb) trainiert werden, die architectur für Inference aber in JS für die Client-Side implementiert. Die Architektur wir self-supervised sein, nämlich eine Policy Optimisation (ein Feedforward Neural Network (FFN) wird lokale Sequenzen von Frames in der sich Bewegenden Drone lernen, wobei die Outputs dieses FFNs die Thruster Intensitäten (x, y) bestimmt, und der Input der State-Vekctor ist.).

### 3. User Inputs
Users sollen die Drone steuern können, in dem sie jeweils die 2 Thrusts an/aus machen (Frequenz von Clicks = Intensität von Thrusters).

### 3. Back-End logging von Scores 
Im back-end werde ich Daten von Scores speichern, mit dem Ziel diese auf einem Leaderboard anzuzeigen.

### 4. Bearbeitbares "Bauset" für Spieler
Sollte die Zeit noch reichen werde ich, um das Game besonders interaktiv und interessant zu machen, ein Interface implementieren das es Users erlaubt, selbst ein PID zu programmieren, um diese gegen meine KI oder sich selbst (oder beide) spielen zu lassen.
