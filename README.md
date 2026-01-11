## AI Drone Race
#### meta = {  
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Titel: "AI Drone Race",
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Sprachen: "JS Client Side + Python Backend",
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Author: "Kaito Soga",
#### &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Fach: "IN29",
#### }
<br>





## Übersicht
In dem geplanten Game tritt ein User in einem Rennen gegen eine KI gesteuerte 2D-Drone an. Das Ziel ist es, so schnell wie möglich von einem Checkpoint zum nächsten zu fliegen, mit einer endlichen Anzahl and Checkpoints.  

Die Steuerung für den User besteht aus zwei Inputs, welche die zwei Antriebe der Drone kontrollieren. Die KI stuert ihre Drone mit einem simplen feedforward network (FFN).  

Zusätzlich kann ein User einen manuellen algorithmus erstellen, durch das Bauen einer Funktion die den Zustandsvektor als input nimmt, und als output die Antriebswerte der Drone gibt. Diese kann ebenfalls gegen die KI oder den User selbst antreten.  

Die Drone selbst unterliegt realistischen Physikalischen Eigenschaften (Schwerkraft, Momentum, Momentum, Beschleunigung, Rotation (-sgeschindigkeit)), und die Umgebung wird zufällig mit vorbestimmten Bildern generiert, wobei die Drone im Mittelpunkt des Canvas bleibt, sodass sich der Hintergrund bewegt.  

*Sollte die Zeit noch reichen, werde ich im Backend auf einem Raspberry-Pi ein simples Login erstellen, um Usern einen Top-Score, Index auf einem öffentlichen Leaderboard, und Top-Score-abhängige Outfits/Styles für die Drone zuzuweisen. Andernfalls ist es mein Ziel, Teil 0 zu implementieren.  
<br><br>





## Details + Schritte der Implementierung
## Teil 0.0:
### 0.1 Realistische Physik für die Drone:
Aufgrund der KI, die ich aus praktischen Gründen in Python trainiere (mir bekannte, optimierte Bibliothek PyTorch, die es in JS nicht gibt), werde ich auch die Physik-Logik vorerst in Python implementieren. Diese soll beeinhalten:

- Schwerkraft
- Momentum
- Momentum
- Beschleunigung
- Rotation
- Rotationsgeschindigkeit  

Diese werde ich ebenfalls in JS implementieren, und auf einem Canvas Element visualisieren.  
<br>

### 0.2 KI Training in Python (verschiedene Schwierigkeitslevel):
Die KI wird eine parametrische Funktion sein, dessen Parameter das im Training optimiert werden. Ziel ist es, dass sie den Zustandsvektor als Input nimmt, und als Output die beiden (stetigen) Werte für die Thrusters gibt. Dafür werde ich ein feedforward network (FFN) mit PID outputs trainieren. Das bedeutet, dass ein manueller algorithmus beispiele von optimalen Output Sequenzen (der Physik-Logik folgend) generiert, und diese als "Vergleich" für die KI gebraucht werden, um dessen Verslust zu bestimmen. Dieser Verlust wird mit MSE berechnet, und mit Adam Optimisation schrittweise optimiert. Damit lernt die KI, was für Werte die Dronenantriebe bekommen sollten, basierend auf deren Zustand.  

Das Resultat wird ein Set von Parametern sein, das ich für die Inferenz der KI in JS laden kann, und somit nur die Inferenz (die deutlich simpler als das Training ist) in JS ausgeführt wird.  

Da die KI auf Zufällig generierten Beispielsequenzen trainiert wird, sollte die Anzahl solcher Beispiele die Performance der KI beeinflusse. Dadurch kann ich verschieden gute KIs speichern, indem ich die Qualität und Quantität der Trainingsdaten variiere. Diese weredn im Game die verschiedenen Schwierigkeitslevels bilden.  
<br>

### 0.3 Inferenz in JS:
Wie angedeutet, wird die Inferenz in JS implementiert (in Python würde sie ebenfalls für Debugging implementiert). Das bedeutet, dass die Architektur (als Funktion mit noch unbestimmten Parametern zu verstehen) zuerst definiert, und dann die von Python gespeicherten Parameter laden wird. Diese Parameter müssen nicht privat sein, und können auf der Client-Side geladen werden (async). Somit wird eine Instanz eines trainierten KI Models in JS geladen. Diese kann dann angewendet werde, um Zustand->Antriebwerte transformationen durchzuführen, um die Drone zu steuern.  
<br>

### 0.4 Visualisierung in Canvas:
Das Verhalten der Dronen soll auf einem Canvas Element visualisiert werden, mit verschiedenen Farben / Designs für die Dronen. Die Antriebe und desser nummerischen Werte sollen ebenfalls visualisiert werden.  

Der Hintergrund wird in Sektion 0.6 genauer beschrieben.  
<br>

### 0.5 User Inputs für Steuerung (Handy + Laptop):
Damit ein User gegen die KI-gesteuerte Drone antreten kann, müssen Input möglichkeiten für User bestehen, sowohl auf dem Handy als auch auf grösseren Screens mit externer Tastatur. Für die beiden Antriebe (j, k) werden zwei Tasten, UP/DOWN oder A/D, die Inputs geben. Anstatt stetige Werte zu generieren, werden dabei binäre Werte (0, 1) generiert, wobei User die Tasten beliebig clicken oder nicht clicken können, um die Drone zu kontrollieren.  
<br>

### 0.6 Zufällig generierte Umgebung (bspw. Bilder):
Um die Umgbung (in Canvas) spannend zu machen, soll der Hintergrund (die Map) des Spiels Zufällig generiert werden, d.h., es soll ein vorbestimmtes Set an Features (visuelle Objekte als PNGs) Anzeigen, bspw. sollen Checkpoints ein bestimmtes Aussehen haben, und der Rest wird als Weltall dargestellt (bspw. mit Weltraumobjekten, Dronen sind Raumschiffe, Planete könne Teil der Map sein).  

Um dies effektiv zu machen, soll die von Usern kontrollierte Drone im Mittelpunkt des Screens bleiben, und der Hintergrund soll sich bewegen, um das Vorkommen einer unendlich grossen Map zu erzeugen.  
<br>

### 0.7 Drag & Drop Interface für eigene Funktion: 
Sollte das eigene interagieren mit dem Spiel anstrengend, oder an den eigenen Fähigkeiten gezweifelt werden, soll es auch die Möglichkeit geben einen eigenen Algorihmus zu bauen, um, im Sinne des Programmierens, selber weniger machen zu müssen. Somit können KIs oder Users selbst gegen eigenen Algorithmen antreten.  

Dazu werden die Elemente des Zustandsvektors (Input der KI), Operatoren, und Float Werte als Ziehbare HTML Elemente dargestellt, wobei die User diese selbst selbst Elemente hinzufügen / entfernen (Drag & Drop), Operatoren und Faktoren definieren, und eine (deterministische) Funktion zur Berechnung der Antriebe erstellen können. Im gegensatz zur Probabilisitischen KI wird diese Funktion (bspw. a*geschwindigkeit_x - b*winkel ...) im Spiel getestet, sodass User die Parameter der Funktion anpassen (quasi debuggen) können.  
<br>

### 0.8 Game-Logik (Schwierigkeitslevels, Scores, Sieger, Start/Pause/Quit, Menu):
Die oben genannten Features sollen möglichst übersichtlich implementiert und verbunden werden. Dazu soll es verschiedene Tabs und ein Menu geben.  

Tabs: Game, Scores, My PID  

Menus:
"Game": Menu zur Auswahl von Input Art (Keyboard / PID), der Schwierigkeit, Länge des Spiels, "Play", "Pause", "Quit" Button, Input möglichkeiten für User
"Scores": Vergangene Punkte, Wins/Defeats, Art von Spieler (Mensch/PID)
"My PID": Das interface, um den eigenen Algorithmus zusammenzustellen

Die Navigation für die Tabs soll dabei immer sichtbar sein.
<br><br>





## Teil 1.0: 
### 1.1 Backend / Login:
Sollte die Zeit noch reichen, werde ich auf einem Raspberry Pi Server als Backend ein simples Login für User erstellen, mit Email, Passwort, und Username. Mit einem Userobjekt können dann folgende Werte assoziiert werden:

- Erreichte Scores (User, PID, Schwierigkeitslevel)
- Index auf dem Leaderboard
- Skins/Outfits der Drone

Ebenfalls werden die Algorithmen eines Users als Option gelistet, bei der Wahl vom Gegner (KIs, PIDs)
<br>

### 1.2 Skins/Outfits für Drone (automatisch angewendet, abhängig von Scores, Siegen, Schwierigkeitslevels)
Das Bild, das das Aussehen der Drone bestimmt soll Stufenweise abhängig vom erreichten Top Score eins Users sein, wobei dieses Aussehen ("Skin" oder "Outfit") mit höheren Top Scores auch "besser aussehen" soll, obwohl das eine subjektive Sache bleibt. 
<br>

### 1.3 Leaderboard:
Das Leaderboard soll die Usernamen und deren Top Scores anzeigen. Diese sollen geordnet augelistet werden, sodass der die besten Spieler und Algorithmen sichtbar sind. Es wird also kategorisiert, ob die Scores von Usern oder eigenen Algorithmen erreicht wurden.
<br>

### 1.4 Benchmarks für Algorithmen
Die eigen erstellten Algorithmen sollen als Option nebst den KIs hochgeladen werden, damit andere User ihren eigene Algorithmus gegen den von anderen Usern testen können (und das Rennen visuell anzeigen lassen). 
<br><br>





## Bemerkungen:
Für die Implementierung ohne Backend sollten Scores, Algorithmen, geladene KI modelle in der Browser-Cache bleiben, um diese beim Neuladen nicht zu verlieren. 



<!--

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

### 3. User Inputs
Users sollen die Drone steuern können, in dem sie jeweils die 2 Thrusts an/aus machen (Frequenz von Clicks = Intensität von Thrusters).

Zusätzlich sollen Users gegen eine KI spielen, d.h., Users müssen versuchen schneller von Checkpoint zu Checkpoint zu fliegen als die von KI kontrollierte Drone. Die KI wird in Python (PyTorch + .ipynb) trainiert werden, die architectur für Inference aber in JS für die Client-Side implementiert. Die Architektur wir self-supervised sein, nämlich eine Policy Optimisation (ein Feedforward Neural Network (FFN) wird lokale Sequenzen von Frames in der sich Bewegenden Drone lernen, wobei die Outputs dieses FFNs die Thruster Intensitäten (x, y) bestimmt, und der Input der State-Vekctor ist.).

### 3. Back-End logging von Scores 
Im back-end werde ich Daten von Scores speichern, mit dem Ziel diese auf einem Leaderboard anzuzeigen.
Genaugenommen, werde ich ein Python Skript entweder mit Flask oder über einen Web-Socket auf meinem Server (Homeserver auf Raspberry Pi) laufen lassen, welches automatisch die Scores von Usern Speichert, und diese auf ein Leaderboard auf der Webseite veröffentlich, d.h., Spieler müssen zu Beginn einen Username wählen, sofern dieser noch verfügbar ist. Da ich nicht erwarte dafür noch viel Zeit zu haben, werde ich kein Passwort verlange oder mit SQL arbeiten, sondern lediglcih die verfügbaren Username in einem .txt oder .csv file auf dem Server speichern, auf das Python zugreift. 

### 4. Bearbeitbares "Bauset" für Spieler
Sollte die Zeit noch reichen werde ich, um das Game besonders interaktiv und interessant zu machen, ein Interface implementieren das es Users erlaubt, selbst ein PID zu programmieren, um diese gegen meine KI oder sich selbst (oder beide) spielen zu lassen.
-->