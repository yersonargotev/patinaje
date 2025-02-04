use std::sync::mpsc::{channel, Sender};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Manager};

pub enum AudioCommand {
    PlaySound(String),
    StopAll,
}

pub struct ThreadSafeAudioPlayer {
    sender: Arc<Mutex<Option<Sender<AudioCommand>>>>,
}

impl ThreadSafeAudioPlayer {
    pub fn new(app_handle: AppHandle) -> Self {
        let (tx, rx) = channel::<AudioCommand>();
        let sender = Arc::new(Mutex::new(Some(tx)));
        let player_sender = sender.clone();

        let thread_app_handle = app_handle.clone();

        std::thread::spawn(move || {
            let (_stream, stream_handle) = match rodio::OutputStream::try_default() {
                Ok(stream) => stream,
                Err(e) => {
                    eprintln!("Failed to initialize audio stream: {}", e);
                    return;
                }
            };

            let sink = match rodio::Sink::try_new(&stream_handle) {
                Ok(sink) => sink,
                Err(e) => {
                    eprintln!("Failed to create audio sink: {}", e);
                    return;
                }
            };

            while let Ok(command) = rx.recv() {
                match command {
                    AudioCommand::PlaySound(sound_type) => {
                        let resource_path = format!("{}.mp3", sound_type);
                        if let Ok(mut path) = thread_app_handle.path().resource_dir() {
                            path.push("resources");
                            path.push(&resource_path);

                            match std::fs::File::open(&path) {
                                Ok(file) => {
                                    match rodio::Decoder::new(std::io::BufReader::new(file)) {
                                        Ok(source) => {
                                            // Detener cualquier sonido actual
                                            sink.stop();
                                            sink.set_volume(1.0);

                                            // Reproducir el nuevo sonido inmediatamente
                                            sink.append(source);
                                            sink.play();

                                            // Esperar un pequeño momento para asegurar que el audio comience
                                            std::thread::sleep(Duration::from_millis(50));
                                        }
                                        Err(e) => {
                                            eprintln!("Error decoding audio {}: {}", sound_type, e)
                                        }
                                    }
                                }
                                Err(e) => {
                                    eprintln!("Error opening audio file {}: {}", sound_type, e)
                                }
                            }
                        }
                    }
                    AudioCommand::StopAll => {
                        sink.stop();
                    }
                }
            }
        });

        Self {
            sender: player_sender,
        }
    }

    pub fn play_sound(&self, sound_type: &str) -> Result<(), Box<dyn std::error::Error + '_>> {
        println!("Playing sound: {}", sound_type);
        if let Some(sender) = self.sender.lock().map_err(|e| Box::new(e))?.as_ref() {
            sender
                .send(AudioCommand::PlaySound(sound_type.to_string()))
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + '_>)
        } else {
            Ok(())
        }
    }

    pub fn stop_all(&self) -> Result<(), Box<dyn std::error::Error + '_>> {
        if let Some(sender) = self.sender.lock().map_err(|e| Box::new(e))?.as_ref() {
            sender
                .send(AudioCommand::StopAll)
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + '_>)
        } else {
            Ok(())
        }
    }
}
