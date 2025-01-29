use std::collections::HashMap;
use std::sync::mpsc::{channel, Sender};
use std::sync::{Arc, Mutex};
use std::thread;
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
        
        thread::spawn(move || {
            match rodio::OutputStream::try_default() {
                Ok((_stream, stream_handle)) => {
                    let mut sinks: HashMap<String, rodio::Sink> = HashMap::new();
                    
                    loop {
                        if let Ok(command) = rx.recv() {
                            match command {
                                AudioCommand::PlaySound(sound_type) => {
                                    let resource_path = format!("{}.mp3", sound_type);
                                    println!("Looking for audio file: {}", resource_path);
                                    
                                    match app_handle.path().resource_dir() {
                                        Ok(mut path) => {
                                            path.push("resources");
                                            path.push(&resource_path);
                                            println!("Attempting to access file at: {:?}", path);
                                            
                                            if let Ok(file) = std::fs::File::open(&path) {
                                                if let Ok(sink) = rodio::Sink::try_new(&stream_handle) {
                                                    match rodio::Decoder::new(std::io::BufReader::new(file)) {
                                                        Ok(source) => {
                                                            sink.append(source);
                                                            sink.play();
                                                            sinks.insert(sound_type, sink);
                                                            println!("Successfully playing audio");
                                                        }
                                                        Err(e) => eprintln!("Error decoding audio: {}", e),
                                                    }
                                                }
                                            } else {
                                                eprintln!("Could not open audio file: {:?}", path);
                                                // Imprimir contenido del directorio para debug
                                                if let Ok(entries) = std::fs::read_dir(&path.parent().unwrap_or(&path)) {
                                                    println!("Directory contents:");
                                                    for entry in entries {
                                                        if let Ok(entry) = entry {
                                                            println!("  {:?}", entry.path());
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        Err(e) => eprintln!("Could not find resource directory: {}", e),
                                    }
                                }
                                AudioCommand::StopAll => {
                                    for (_, sink) in sinks.drain() {
                                        sink.stop();
                                    }
                                }
                            }
                        }
                    }
                }
                Err(err) => {
                    eprintln!("Error initializing audio system: {}", err);
                }
            }
        });

        Self { sender }
    }

    pub fn play_sound(&self, sound_type: &str) -> Result<(), Box<dyn std::error::Error + '_>> {
        println!("Attempting to play sound: {}", sound_type);
        if let Some(sender) = self.sender.lock().map_err(|e| Box::new(e) as Box<dyn std::error::Error + '_>)?.as_ref() {
            sender.send(AudioCommand::PlaySound(sound_type.to_string()))
                .map_err(move |e| Box::new(e) as Box<dyn std::error::Error + '_>)
        } else {
            Ok(())
        }
    }

    pub fn stop_all(&self) -> Result<(), Box<dyn std::error::Error + '_>> {
        if let Some(sender) = self.sender.lock().map_err(|e| Box::new(e) as Box<dyn std::error::Error + '_>)?.as_ref() {
            sender.send(AudioCommand::StopAll)
                .map_err(move |e| Box::new(e) as Box<dyn std::error::Error + '_>)
        } else {
            Ok(())
        }
    }
}