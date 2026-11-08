import { group } from './util';
// Added on request, 2026-11-08.
const dockerBasics = group('Docker-Grundlagen', [
    { front: 'Was ist Docker?', back: 'Eine Plattform, mit der man Anwendungen samt Abhängigkeiten in Container packt und überall gleich ausführt.' },
    { front: 'Container vs. virtuelle Maschine', back: 'Eine VM bringt ein eigenes Betriebssystem mit. Container teilen sich den Kernel des Rechners – sie sind kleiner und starten in Sekunden.' },
    { front: 'Image vs. Container', back: 'Ein Image ist die unveränderliche Vorlage, ein Container eine laufende Instanz davon.', note: 'Vergleich aus der Programmierung: Image = Klasse, Container = Objekt.' },
    { front: 'Was ist ein Dockerfile?', back: 'Eine Textdatei mit der Bauanleitung für ein Image, Schritt für Schritt.' },
    { front: 'Was ist eine Container-Registry?', back: 'Ein Speicher für Images, aus dem man sie herunterlädt und in den man sie hochlädt, z. B. Docker Hub.', note: 'Weitere: GitHub Container Registry, Amazon ECR.' },
    { front: 'Was ist ein Image-Tag?', back: 'Die Bezeichnung einer Image-Version, z. B. python:3.12 oder nginx:latest.', note: 'latest ist nur der Standard-Tag, nicht unbedingt die neueste Version. In Produktion feste Versionen nehmen.' },
    { front: 'Was sind Image-Layer?', back: 'Ein Image besteht aus Schichten, grob eine pro Anweisung im Dockerfile. Unveränderte Schichten kommen aus dem Cache, das beschleunigt den Build.', note: 'Darum Dinge, die sich selten ändern (z. B. Abhängigkeiten), möglichst früh im Dockerfile installieren.' },
    { front: 'Was ist ein Volume (Docker)?', back: 'Ein Speicher außerhalb des Containers. Daten darin bleiben erhalten, auch wenn der Container gelöscht wird.', note: 'Typisch für Datenbanken. Ohne Volume ist alles weg, was der Container geschrieben hat.' },
    { front: 'Was ist ein Port-Mapping?', back: 'Es leitet einen Port des Rechners an einen Port im Container weiter.', note: '-p 8080:80 macht Port 80 des Containers unter localhost:8080 erreichbar.' },
    { front: 'Was ist der Docker Daemon?', back: 'Der Hintergrunddienst (dockerd), der Images baut und Container startet. Der Befehl docker schickt ihm nur Aufträge.' },
]);
const dockerfile = group('Dockerfile', [
    { front: 'Was macht FROM im Dockerfile?', back: 'Legt das Basis-Image fest, auf dem man aufbaut, z. B. FROM node:22.' },
    { front: 'Was macht RUN im Dockerfile?', back: 'Führt beim Bauen des Images einen Befehl aus, z. B. RUN npm install.' },
    { front: 'Was macht COPY im Dockerfile?', back: 'Kopiert Dateien vom eigenen Rechner (aus dem Build-Kontext) ins Image.' },
    { front: 'Was macht WORKDIR im Dockerfile?', back: 'Legt das Arbeitsverzeichnis im Image fest, in dem die folgenden Befehle laufen.' },
    { front: 'CMD vs. ENTRYPOINT', back: 'Beide legen fest, was beim Start des Containers läuft. CMD lässt sich beim Start leicht überschreiben. ENTRYPOINT ist das feste Programm, CMD liefert dann nur die Standardargumente.' },
    { front: 'Was macht EXPOSE im Dockerfile?', back: 'Es dokumentiert, auf welchem Port die Anwendung lauscht. Erreichbar wird der Port erst mit -p beim Start.' },
    { front: 'Wozu dient .dockerignore?', back: 'Schließt Dateien vom Build aus, z. B. node_modules oder .git – das macht Builds schneller und Images kleiner.' },
    { front: 'Was ist ein Multi-Stage-Build?', back: 'Ein Dockerfile mit mehreren FROM-Abschnitten: Man baut in einem großen Image und kopiert nur das Ergebnis in ein kleines.', note: 'So landen Compiler und Build-Werkzeuge nicht im fertigen Image.' },
]);
const dockerCommands = group('Docker-Befehle', [
    { front: 'Was macht docker build -t meine-app .?', back: 'Baut aus dem Dockerfile im aktuellen Ordner ein Image mit dem Namen meine-app.' },
    { front: 'Was macht docker run?', back: 'Startet einen neuen Container aus einem Image.', note: '-d im Hintergrund, -p für Ports, --name für einen Namen, --rm löscht den Container nach dem Beenden.' },
    { front: 'Was macht docker ps?', back: 'Zeigt die laufenden Container.', note: 'docker ps -a zeigt auch die beendeten.' },
    { front: 'Was macht docker exec -it <container> sh?', back: 'Öffnet eine Shell in einem laufenden Container – praktisch zur Fehlersuche.' },
    { front: 'Was macht docker logs?', back: 'Zeigt die Ausgaben eines Containers.', note: 'docker logs -f folgt der Ausgabe live.' },
    { front: 'docker stop vs. docker rm', back: 'stop hält einen Container an, rm löscht ihn. Ein gestoppter Container lässt sich mit docker start wieder starten.' },
    { front: 'Was macht docker pull?', back: 'Lädt ein Image aus einer Registry herunter, z. B. docker pull postgres:16.' },
    { front: 'Was macht docker system prune?', back: 'Räumt auf: Es löscht gestoppte Container, ungenutzte Netzwerke und Images ohne Namen.', note: 'Mit -a auch alle Images, die kein Container nutzt – vorsichtig verwenden.' },
]);
const compose = group('Docker Compose', [
    { front: 'Was ist Docker Compose?', back: 'Ein Werkzeug, um mehrere Container gemeinsam zu beschreiben und zu starten, z. B. App, Datenbank und Cache.', note: 'Die Beschreibung steht in compose.yaml (früher docker-compose.yml).' },
    { front: 'Was macht docker compose up -d?', back: 'Startet alle Dienste aus der Compose-Datei im Hintergrund.', note: 'docker compose down stoppt und entfernt sie wieder.' },
    { front: 'Wie finden sich Container in Docker Compose gegenseitig?', back: 'Über den Dienstnamen: Die App erreicht die Datenbank z. B. unter dem Hostnamen db.' },
    { front: 'Was macht depends_on in Docker Compose?', back: 'Legt die Startreihenfolge fest: Ein Dienst startet erst nach den Diensten, von denen er abhängt.', note: 'Ob die Datenbank schon Anfragen annimmt, stellt erst ein Healthcheck sicher.' },
]);
const k8sBasics = group('Kubernetes-Grundlagen', [
    { front: 'Was ist Kubernetes?', back: 'Eine Plattform, die Container auf vielen Rechnern automatisch verteilt, startet, skaliert und bei Ausfällen ersetzt.', note: 'Kurz K8s: Zwischen K und s stehen 8 Buchstaben. Ursprünglich von Google entwickelt.' },
    { front: 'Was ist ein Kubernetes-Cluster?', back: 'Alle Rechner, die Kubernetes gemeinsam verwaltet: die Control Plane und die Worker Nodes.' },
    { front: 'Was ist ein Node (Kubernetes)?', back: 'Ein einzelner Rechner, physisch oder virtuell, im Cluster, auf dem Pods laufen.' },
    { front: 'Was ist ein Pod?', back: 'Die kleinste Einheit in Kubernetes: ein oder mehrere Container, die sich Netzwerk und Speicher teilen.', note: 'Meist steckt in einem Pod genau ein Container.' },
    { front: 'Was ist die Control Plane?', back: 'Die Steuerzentrale des Clusters: API-Server, Scheduler, Controller und die Datenbank etcd.', note: 'Der Scheduler entscheidet, auf welchem Node ein neuer Pod läuft.' },
    { front: 'Was ist kubectl?', back: 'Das Kommandozeilenwerkzeug, mit dem man einen Kubernetes-Cluster steuert.', note: 'kubectl get pods listet Pods, kubectl logs zeigt Ausgaben, kubectl describe zeigt Details und Ereignisse.' },
    { front: 'Was ist ein Namespace (Kubernetes)?', back: 'Ein abgetrennter Bereich im Cluster, z. B. für einzelne Teams oder für Test und Produktion.' },
    { front: 'Was bedeutet „deklarativ“ in Kubernetes?', back: 'Man beschreibt den gewünschten Zustand („3 Kopien dieser App“), und Kubernetes sorgt ständig dafür, dass er erreicht wird.' },
    { front: 'Was ist ein Kubernetes-Manifest?', back: 'Eine YAML-Datei, die eine Ressource beschreibt, z. B. ein Deployment.', note: 'Anwenden mit kubectl apply -f datei.yaml.' },
    { front: 'Was ist Helm?', back: 'Der Paketmanager für Kubernetes: Ein Chart bündelt alle Manifeste einer Anwendung, die man über Werte anpasst.' },
]);
const k8sResources = group('Kubernetes-Ressourcen', [
    { front: 'Was ist ein Deployment (Kubernetes)?', back: 'Beschreibt, welches Image in wie vielen Pods laufen soll. Kubernetes hält diese Zahl und tauscht die Pods bei Updates schrittweise aus.', note: 'Das schrittweise Austauschen heißt Rolling Update.' },
    { front: 'Was ist ein Service (Kubernetes)?', back: 'Eine feste Adresse für eine Gruppe von Pods, die Anfragen auf sie verteilt – auch wenn Pods kommen und gehen.', note: 'Typen: ClusterIP (nur intern), NodePort und LoadBalancer.' },
    { front: 'Was ist ein Ingress?', back: 'Leitet HTTP-Anfragen von außen anhand von Domain und Pfad an die passenden Services weiter.', note: 'Dafür braucht der Cluster einen Ingress Controller. Als Nachfolger gilt die Gateway API.' },
    { front: 'ConfigMap vs. Secret', back: 'Beide liefern Konfiguration an Pods: ConfigMaps für normale Einstellungen, Secrets für Passwörter und Schlüssel.', note: 'Secrets sind standardmäßig nur Base64-kodiert, nicht verschlüsselt.' },
    { front: 'Was ist ein PersistentVolume?', back: 'Dauerhafter Speicher im Cluster, unabhängig von einzelnen Pods. Pods fordern ihn über einen PersistentVolumeClaim an.' },
    { front: 'Was ist ein StatefulSet?', back: 'Wie ein Deployment, aber für Anwendungen mit Zustand wie Datenbanken: Jeder Pod behält einen festen Namen und eigenen Speicher.' },
    { front: 'Was ist ein DaemonSet?', back: 'Startet auf jedem Node genau einen Pod, z. B. für Log-Sammler oder Monitoring.' },
    { front: 'Job vs. CronJob (Kubernetes)', back: 'Ein Job führt eine Aufgabe einmal bis zum Ende aus, ein CronJob regelmäßig nach Zeitplan, z. B. jede Nacht ein Backup.' },
    { front: 'Liveness- vs. Readiness-Probe', back: 'Liveness prüft, ob ein Container noch lebt – sonst wird er neu gestartet. Readiness prüft, ob er Anfragen annehmen kann – sonst bekommt er keine.' },
    { front: 'Was macht der Horizontal Pod Autoscaler?', back: 'Er passt die Zahl der Pods automatisch an die Last an, z. B. an die CPU-Auslastung.' },
]);
export const dockerKubernetesDeck = {
    id: 'docker-kubernetes',
    name: 'Docker & Kubernetes',
    description: 'Images, Container, Compose und Kubernetes – vom ersten Dockerfile bis zum Cluster.',
    icon: 'container',
    color: 5,
    frontLang: 'de-DE',
    backLang: 'de-DE',
    cards: [...dockerBasics, ...dockerfile, ...dockerCommands, ...compose, ...k8sBasics, ...k8sResources],
};
