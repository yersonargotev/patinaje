use std::collections::HashMap;
use std::sync::mpsc::{channel, Sender};
use std::sync::{Arc, Mutex};
use std::thread;

pub enum AudioCommand {
    PlaySound(String),
    StopAll,
}

pub struct ThreadSafeAudioPlayer {
    sender: Arc<Mutex<Sender<AudioCommand>>>,
}

impl ThreadSafeAudioPlayer {
    pub fn new() -> Self {
        let (tx, rx) = channel::<AudioCommand>();
        let sender = Arc::new(Mutex::new(tx));
        
        // Spawn audio thread
        thread::spawn(move || {
            let (_stream, stream_handle) = rodio::OutputStream::try_default().unwrap();
            let mut sinks: HashMap<String, rodio::Sink> = HashMap::new();
            
            loop {
                if let Ok(command) = rx.recv() {
                    match command {
                        AudioCommand::PlaySound(sound_type) => {
                            if let Ok(file) = std::fs::File::open(format!("resources/{}.mp3", sound_type)) {
                                if let Ok(sink) = rodio::Sink::try_new(&stream_handle) {
                                    if let Ok(source) = rodio::Decoder::new(std::io::BufReader::new(file)) {
                                        sink.append(source);
                                        sink.play();
                                        sinks.insert(sound_type, sink);
                                    }
                                }
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
        });

        Self { sender }
    }

    pub fn play_sound(&self, sound_type: &str) -> Result<(), Box<dyn std::error::Error + '_>> {
        self.sender
            .lock()
            .map_err(move |e| Box::new(e) as Box<dyn std::error::Error + '_>)?
            .send(AudioCommand::PlaySound(sound_type.to_string()))
            .map_err(move |e| Box::new(e) as Box<dyn std::error::Error + '_>)
    }

    pub fn stop_all(&self) -> Result<(), Box<dyn std::error::Error + '_>> {
        self.sender
            .lock()
            .map_err(move |e| Box::new(e) as Box<dyn std::error::Error + '_>)?
            .send(AudioCommand::StopAll)
            .map_err(move |e| Box::new(e) as Box<dyn std::error::Error + '_>)
    }
}