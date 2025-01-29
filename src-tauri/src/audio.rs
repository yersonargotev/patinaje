use rodio::{Decoder, OutputStream, Sink};
use std::fs::File;
use std::io::BufReader;
use std::sync::Mutex;
use std::{collections::HashMap, path::PathBuf};

pub struct AudioPlayer {
    sinks: Mutex<HashMap<String, Sink>>,
    _stream: OutputStream,
    _stream_handle: rodio::OutputStreamHandle,
}

impl AudioPlayer {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let (stream, stream_handle) = OutputStream::try_default()?;
        Ok(Self {
            sinks: Mutex::new(HashMap::new()),
            _stream: stream,
            _stream_handle: stream_handle,
        })
    }

    pub fn play_sound(&self, sound_type: &str) -> Result<(), Box<dyn std::error::Error>> {
        let resource_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("resources")
            .join(format!("{}.mp3", sound_type));

        let file = File::open(resource_path)?;
        let reader = BufReader::new(file);
        let source = Decoder::new(reader)?;
        
        let sink = Sink::try_new(&self._stream_handle)?;
        sink.append(source);
        sink.play();
        
        let mut sinks = self.sinks.lock().unwrap();
        sinks.insert(sound_type.to_string(), sink);
        
        Ok(())
    }

    pub fn stop_all(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut sinks = self.sinks.lock().unwrap();
        for (_, sink) in sinks.drain() {
            sink.stop();
        }
        Ok(())
    }
}