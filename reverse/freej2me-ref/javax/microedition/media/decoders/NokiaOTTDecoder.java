/*
 * Decompiled with CFR 0.152.
 */
package javax.microedition.media.decoders;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.sound.midi.InvalidMidiDataException;
import javax.sound.midi.MetaMessage;
import javax.sound.midi.MidiEvent;
import javax.sound.midi.MidiSystem;
import javax.sound.midi.MidiUnavailableException;
import javax.sound.midi.Sequence;
import javax.sound.midi.ShortMessage;
import javax.sound.midi.Track;
import org.recompile.mobile.Mobile;

public class NokiaOTTDecoder {
    public static final int NATURAL_STYLE = 0;
    public static final int CONTINUOUS_STYLE = 1;
    public static final int STACCATO_STYLE = 2;
    private static final double SEMITONE_CONST = 17.31234049066755;
    private static int parsePos = 0;
    private static byte curBitPos = 0;
    private static byte[] data;
    private static float noteScale;
    private static int noteStyle;
    private static int curTick;
    private static int lastPatternPos;
    private static byte lastPatternBitPos;
    private static int lastPatternLen;
    private static int restorePatternPos;
    private static byte restorePatternBitPos;
    private static final String[] noteStrings;

    public static int convertFreqToNote(int n) {
        return (int)Math.round(Math.log((double)n / 8.176) * 17.31234049066755);
    }

    public static synchronized byte[] convertToMidi(byte[] byArray) throws MidiUnavailableException, IOException {
        try {
            parsePos = 0;
            curBitPos = 0;
            noteScale = 1.0f;
            noteStyle = 0;
            curTick = 0;
            data = byArray;
            Sequence sequence = new Sequence(0.0f, 24);
            Track track = sequence.createTrack();
            ShortMessage shortMessage = new ShortMessage();
            ShortMessage shortMessage2 = new ShortMessage();
            ShortMessage shortMessage3 = new ShortMessage();
            shortMessage.setMessage(176, 0, 0, 1);
            shortMessage2.setMessage(176, 0, 32, 0);
            shortMessage3.setMessage(192, 0, 80, 0);
            track.add(new MidiEvent(shortMessage, 0L));
            track.add(new MidiEvent(shortMessage2, 1L));
            track.add(new MidiEvent(shortMessage3, 0L));
            int n = NokiaOTTDecoder.readBits(8);
            Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Command length: " + n);
            block11: for (int i = 0; i < n; ++i) {
                int n2 = NokiaOTTDecoder.readBits(8);
                switch (n2) {
                    case 74: {
                        Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Ringing tone programming detected.");
                        NokiaOTTDecoder.parseRingingTone(track);
                        ++i;
                        continue block11;
                    }
                    case 68: {
                        Mobile.log((byte)3, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Unicode detected.");
                        NokiaOTTDecoder.parseUnicode();
                        continue block11;
                    }
                    case 58: {
                        Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Sound detected.");
                        NokiaOTTDecoder.parseSound(track);
                        continue block11;
                    }
                    case 10: {
                        if (NokiaOTTDecoder.readBits(7) != 5) {
                            throw new IllegalArgumentException("Invalid cancel command specifier");
                        }
                        NokiaOTTDecoder.parseUnicode();
                        Mobile.log((byte)3, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Cancel command detected. Returning.");
                        continue block11;
                    }
                    case 0: {
                        Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": End of ringtone programming!");
                        continue block11;
                    }
                    default: {
                        Mobile.log((byte)4, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Unknown command type: " + Integer.toBinaryString(n2));
                    }
                }
            }
            try {
                ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
                MidiSystem.write(sequence, 0, byteArrayOutputStream);
                return byteArrayOutputStream.toByteArray();
            }
            catch (IOException iOException) {
                Mobile.log((byte)4, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ":  couldn't write converted Tone Sequence:" + iOException.getMessage());
                return null;
            }
        }
        catch (InvalidMidiDataException invalidMidiDataException) {
            Mobile.log((byte)4, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ":  couldn't convert Tone Sequence:" + invalidMidiDataException.getMessage());
            return null;
        }
    }

    private static void parseRingingTone(Track track) {
        int n = NokiaOTTDecoder.readBits(7);
        if (n == 29) {
            Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Detected Sound!");
            NokiaOTTDecoder.parseSound(track);
        } else if (n == 34) {
            NokiaOTTDecoder.parseUnicode();
        } else {
            throw new IllegalArgumentException("Invalid set of bits for ringing-tone-programming");
        }
    }

    private static void parseUnicode() {
        short s = (short)NokiaOTTDecoder.readBits(16);
        Mobile.log((byte)3, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Unicode:" + s);
    }

    private static void parseSound(Track track) {
        int n = NokiaOTTDecoder.readBits(3);
        switch (n) {
            case 1: {
                Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Basic Song Detected!");
                NokiaOTTDecoder.parseBasicSong(track);
                break;
            }
            case 2: {
                Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Temporary Song Detected!");
                NokiaOTTDecoder.parseTemporarySong(track);
                break;
            }
            case 3: {
                Mobile.log((byte)3, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": MIDI Song Detected!");
                throw new IllegalArgumentException("Unsupported song format");
            }
            case 4: {
                Mobile.log((byte)3, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Digitized Song Detected!");
                throw new IllegalArgumentException("Unsupported song format");
            }
            case 5: {
                Mobile.log((byte)3, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Polyphonic Song Detected!");
                throw new IllegalArgumentException("Unsupported song format");
            }
            default: {
                Mobile.log((byte)4, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Unknown song type: " + Integer.toBinaryString(n));
                throw new IllegalArgumentException("Unsupported song format");
            }
        }
    }

    private static void parseBasicSong(Track track) {
        int n = NokiaOTTDecoder.readBits(4);
        StringBuilder stringBuilder = new StringBuilder();
        for (int i = 0; i < n; ++i) {
            char c = (char)NokiaOTTDecoder.readBits(8);
            stringBuilder.append(c);
        }
        Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Title Length:" + n + " | Basic Song Title: " + stringBuilder.toString());
        NokiaOTTDecoder.parseTemporarySong(track);
    }

    private static void parseTemporarySong(Track track) {
        int n = NokiaOTTDecoder.readBits(8);
        Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Song Sequence Length: " + n);
        for (int i = 0; i < n; ++i) {
            NokiaOTTDecoder.parseSongPattern(track);
        }
    }

    private static void parseSongPattern(Track track) {
        int n = NokiaOTTDecoder.readBits(3);
        int n2 = NokiaOTTDecoder.readBits(2);
        int n3 = NokiaOTTDecoder.readBits(4);
        Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Pattern Header - ID: " + n + ", Pattern ID: " + n2 + ", Loop Value: " + n3);
        if (n3 == 15) {
            Mobile.log((byte)3, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": OTA/OTT Tone Infinite Loop parsing is not implemented. Parsing pattern without loop...");
            n3 = 0;
        }
        int n4 = parsePos;
        byte by = curBitPos;
        while (n3 >= 0) {
            int n5;
            parsePos = n4;
            curBitPos = by;
            int n6 = NokiaOTTDecoder.readBits(8);
            if (n6 == 0) {
                Mobile.log((byte)3, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Using already-defined pattern.");
                restorePatternPos = parsePos;
                restorePatternBitPos = curBitPos;
                while (n3 >= 0) {
                    Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": New pattern length: " + n6);
                    parsePos = lastPatternPos;
                    curBitPos = lastPatternBitPos;
                    for (n5 = 0; n5 < lastPatternLen; ++n5) {
                        NokiaOTTDecoder.parsePatternInstruction(track);
                    }
                    --n3;
                }
                parsePos = restorePatternPos;
                curBitPos = restorePatternBitPos;
                return;
            }
            Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": New pattern length: " + n6);
            lastPatternLen = n5 = n6;
            lastPatternPos = parsePos;
            lastPatternBitPos = curBitPos;
            noteStyle = 0;
            noteScale = 1.0f;
            for (int i = 0; i < n5; ++i) {
                NokiaOTTDecoder.parsePatternInstruction(track);
            }
            --n3;
        }
    }

    private static void parsePatternInstruction(Track track) {
        int n = NokiaOTTDecoder.readBits(3);
        Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": instructionType: " + n);
        switch (n) {
            case 1: {
                NokiaOTTDecoder.parseNoteInstruction(track);
                break;
            }
            case 2: {
                NokiaOTTDecoder.parseScaleInstruction();
                break;
            }
            case 3: {
                NokiaOTTDecoder.parseStyleInstruction();
                break;
            }
            case 4: {
                NokiaOTTDecoder.parseTempoInstruction(track);
                break;
            }
            case 5: {
                NokiaOTTDecoder.parseVolumeInstruction(track);
                break;
            }
            default: {
                Mobile.log((byte)4, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Unknown instruction type: " + Integer.toBinaryString(n));
            }
        }
    }

    private static void parseNoteInstruction(Track track) {
        int n = NokiaOTTDecoder.readBits(4);
        int n2 = NokiaOTTDecoder.readBits(3);
        int n3 = NokiaOTTDecoder.readBits(2);
        int n4 = NokiaOTTDecoder.convertNoteValueToMidi(n);
        int n5 = NokiaOTTDecoder.convertDurationToTicks(n2, n3);
        Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": noteDuration: " + n2 + "| durationSpecifier: " + n3);
        try {
            if (n4 != -1) {
                ShortMessage shortMessage = new ShortMessage();
                ShortMessage shortMessage2 = new ShortMessage();
                shortMessage.setMessage(144, 0, n4, 93);
                track.add(new MidiEvent(shortMessage, curTick));
                if (noteStyle == 2) {
                    shortMessage2.setMessage(128, 0, n4, 0);
                    track.add(new MidiEvent(shortMessage2, curTick + (int)((float)n5 * 0.6f)));
                } else if (noteStyle == 1) {
                    shortMessage2.setMessage(128, 0, n4, 0);
                    track.add(new MidiEvent(shortMessage2, curTick + n5));
                } else {
                    shortMessage2.setMessage(128, 0, n4, 0);
                    track.add(new MidiEvent(shortMessage2, curTick + (int)((float)n5 * 0.8f)));
                }
            }
            curTick += n5;
        }
        catch (InvalidMidiDataException invalidMidiDataException) {
            Mobile.log((byte)4, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Couldn't parse note instruction:" + invalidMidiDataException.getMessage());
        }
    }

    private static void parseScaleInstruction() {
        int n = NokiaOTTDecoder.readBits(2);
        switch (n) {
            case 0: {
                Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Scale-1: A = 440 Hz");
                noteScale = 0.5f;
                break;
            }
            case 1: {
                Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Scale-2: A = 880 Hz (default)");
                noteScale = 1.0f;
                break;
            }
            case 2: {
                Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Scale-3: A = 1.76 kHz");
                noteScale = 2.0f;
                break;
            }
            case 3: {
                Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Scale-4: A = 3.52 kHz");
                noteScale = 4.0f;
                break;
            }
            default: {
                Mobile.log((byte)4, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Unknown scale value");
            }
        }
    }

    private static void parseStyleInstruction() {
        int n = NokiaOTTDecoder.readBits(2);
        switch (n) {
            case 0: {
                Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Natural Style (rest between notes)");
                noteStyle = 0;
                break;
            }
            case 1: {
                Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Continuous Style (no rest between notes)");
                noteStyle = 1;
                break;
            }
            case 2: {
                Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Staccato Style (shorter notes)");
                noteStyle = 2;
                break;
            }
            case 3: {
                Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": RESERVED");
                break;
            }
            default: {
                Mobile.log((byte)4, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Unknown style value");
            }
        }
    }

    private static void parseTempoInstruction(Track track) {
        int n = NokiaOTTDecoder.readBits(5);
        int n2 = 0;
        switch (n) {
            case 0: {
                n2 = 25;
                break;
            }
            case 1: {
                n2 = 28;
                break;
            }
            case 2: {
                n2 = 31;
                break;
            }
            case 3: {
                n2 = 35;
                break;
            }
            case 4: {
                n2 = 40;
                break;
            }
            case 5: {
                n2 = 45;
                break;
            }
            case 6: {
                n2 = 50;
                break;
            }
            case 7: {
                n2 = 56;
                break;
            }
            case 8: {
                n2 = 63;
                break;
            }
            case 9: {
                n2 = 70;
                break;
            }
            case 10: {
                n2 = 80;
                break;
            }
            case 11: {
                n2 = 90;
                break;
            }
            case 12: {
                n2 = 100;
                break;
            }
            case 13: {
                n2 = 112;
                break;
            }
            case 14: {
                n2 = 125;
                break;
            }
            case 15: {
                n2 = 140;
                break;
            }
            case 16: {
                n2 = 160;
                break;
            }
            case 17: {
                n2 = 180;
                break;
            }
            case 18: {
                n2 = 200;
                break;
            }
            case 19: {
                n2 = 225;
                break;
            }
            case 20: {
                n2 = 250;
                break;
            }
            case 21: {
                n2 = 285;
                break;
            }
            case 22: {
                n2 = 320;
                break;
            }
            case 23: {
                n2 = 355;
                break;
            }
            case 24: {
                n2 = 400;
                break;
            }
            case 25: {
                n2 = 450;
                break;
            }
            case 26: {
                n2 = 500;
                break;
            }
            case 27: {
                n2 = 565;
                break;
            }
            case 28: {
                n2 = 635;
                break;
            }
            case 29: {
                n2 = 715;
                break;
            }
            case 30: {
                n2 = 800;
                break;
            }
            case 31: {
                n2 = 900;
                break;
            }
            default: {
                Mobile.log((byte)4, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Unknown BPM value");
            }
        }
        int n3 = 60000000 / n2;
        try {
            MetaMessage metaMessage = new MetaMessage();
            metaMessage.setMessage(81, new byte[]{(byte)(n3 >> 16), (byte)(n3 >> 8), (byte)n3}, 3);
            track.add(new MidiEvent(metaMessage, curTick));
            Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Tempo Instruction - BPM: " + n2);
        }
        catch (InvalidMidiDataException invalidMidiDataException) {
            Mobile.log((byte)4, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Error adding BPM event:" + invalidMidiDataException.getMessage());
        }
    }

    private static void parseVolumeInstruction(Track track) {
        int n = NokiaOTTDecoder.readBits(4);
        int n2 = 0;
        switch (n) {
            case 0: {
                n2 = 0;
                break;
            }
            case 1: {
                n2 = 48;
                break;
            }
            case 2: {
                n2 = 56;
                break;
            }
            case 3: {
                n2 = 64;
                break;
            }
            case 4: {
                n2 = 72;
                break;
            }
            case 5: {
                n2 = 80;
                break;
            }
            case 6: {
                n2 = 88;
                break;
            }
            case 7: {
                n2 = 92;
                break;
            }
            case 8: {
                n2 = 100;
                break;
            }
            case 9: {
                n2 = 104;
                break;
            }
            case 10: {
                n2 = 108;
                break;
            }
            case 11: {
                n2 = 112;
                break;
            }
            case 12: {
                n2 = 116;
                break;
            }
            case 13: {
                n2 = 120;
                break;
            }
            case 14: {
                n2 = 124;
                break;
            }
            default: {
                n2 = 127;
            }
        }
        Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Volume Instruction: " + n);
        try {
            ShortMessage shortMessage = new ShortMessage();
            shortMessage.setMessage(176, 0, 7, n2);
            track.add(new MidiEvent(shortMessage, curTick));
        }
        catch (InvalidMidiDataException invalidMidiDataException) {
            Mobile.log((byte)4, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Error on volume change event:" + invalidMidiDataException.getMessage());
        }
    }

    private static int convertNoteValueToMidi(int n) {
        int n2 = 0;
        switch (n) {
            case 0: {
                Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Parsed Pause note. ");
                return -1;
            }
            case 1: {
                n2 = 523;
                break;
            }
            case 2: {
                n2 = 554;
                break;
            }
            case 3: {
                n2 = 587;
                break;
            }
            case 4: {
                n2 = 622;
                break;
            }
            case 5: {
                n2 = 659;
                break;
            }
            case 6: {
                n2 = 698;
                break;
            }
            case 7: {
                n2 = 740;
                break;
            }
            case 8: {
                n2 = 784;
                break;
            }
            case 9: {
                n2 = 831;
                break;
            }
            case 10: {
                n2 = 880;
                break;
            }
            case 11: {
                n2 = 932;
                break;
            }
            case 12: {
                n2 = 988;
                break;
            }
            default: {
                Mobile.log((byte)3, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Parsed Note: " + noteStrings[n] + ". Returning a pause instead.");
                return -1;
            }
        }
        int n3 = NokiaOTTDecoder.convertFreqToNote((int)((float)n2 * noteScale));
        if (Mobile.minLogLevel == 1) {
            int n4 = (int)Math.floor(Math.log(noteScale) / Math.log(2.0));
            if (n4 < 0) {
                n4 = 0;
            }
            Mobile.log((byte)1, NokiaOTTDecoder.class.getPackage().getName() + "." + NokiaOTTDecoder.class.getSimpleName() + ": Parsed Note: " + noteStrings[n] + (n4 + 1) + " | Converted to Midi:" + n3);
        }
        return n3;
    }

    private static int convertDurationToTicks(int n, int n2) {
        int n3 = 24;
        switch (n) {
            case 0: {
                n3 *= 4;
                break;
            }
            case 1: {
                n3 *= 2;
                break;
            }
            case 3: {
                n3 /= 2;
                break;
            }
            case 4: {
                n3 /= 4;
                break;
            }
            case 5: {
                n3 /= 8;
                break;
            }
        }
        switch (n2) {
            case 1: {
                n3 = (int)((double)n3 * 1.5);
                break;
            }
            case 2: {
                n3 = (int)((double)n3 * 1.75);
                break;
            }
            case 3: {
                n3 = (int)((double)n3 * 0.6666666666666666);
                break;
            }
        }
        return n3;
    }

    private static int readBits(int n) {
        int n2 = 0;
        for (int i = 0; i < n; ++i) {
            if (parsePos >= data.length) {
                return 0;
            }
            n2 <<= 1;
            n2 |= (data[parsePos] & 1 << 7 - curBitPos) != 0 ? 1 : 0;
            if ((curBitPos = (byte)(curBitPos + 1)) != 8) continue;
            curBitPos = 0;
            ++parsePos;
        }
        return n2;
    }

    static {
        noteScale = 1.0f;
        noteStyle = 0;
        curTick = 0;
        lastPatternPos = 0;
        lastPatternBitPos = 0;
        lastPatternLen = 0;
        restorePatternPos = 0;
        restorePatternBitPos = 0;
        noteStrings = new String[]{"Pause", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "H", "Reserved", "Reserved", "Reserved"};
    }
}

