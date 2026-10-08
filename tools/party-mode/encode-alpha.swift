import Foundation
import AVFoundation
import CoreGraphics
import ImageIO

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
let size = Int(CommandLine.arguments[3])!
let bitrate = Int(CommandLine.arguments[4])!
try? FileManager.default.removeItem(at: output)
let writer = try AVAssetWriter(outputURL: output, fileType: .mov)
let settings: [String: Any] = [AVVideoCodecKey: AVVideoCodecType.hevcWithAlpha, AVVideoWidthKey: size, AVVideoHeightKey: size, AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: bitrate, AVVideoMaxKeyFrameIntervalKey: 48]]
let track = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
track.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: track, sourcePixelBufferAttributes: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: size, kCVPixelBufferHeightKey as String: size, kCVPixelBufferCGImageCompatibilityKey as String: true, kCVPixelBufferCGBitmapContextCompatibilityKey as String: true])
writer.add(track)
guard writer.startWriting() else { fatalError("Start: \(String(describing: writer.error))") }
writer.startSession(atSourceTime: .zero)
for index in 0..<288 {
  while !track.isReadyForMoreMediaData {
    if writer.status == .failed { fatalError("Encode: \(String(describing: writer.error))") }
    Thread.sleep(forTimeInterval: 0.005)
  }
  let url = input.appendingPathComponent(String(format: "%03d.png", index + 1))
  let imageSource = CGImageSourceCreateWithURL(url as CFURL, nil)!
  let image = CGImageSourceCreateImageAtIndex(imageSource, 0, nil)!
  var buffer: CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &buffer)
  let pixel = buffer!
  CVPixelBufferLockBaseAddress(pixel, [])
  let context = CGContext(data: CVPixelBufferGetBaseAddress(pixel), width: size, height: size, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(pixel), space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue)!
  context.clear(CGRect(x: 0, y: 0, width: size, height: size))
  context.draw(image, in: CGRect(x: 0, y: 0, width: size, height: size))
  CVPixelBufferUnlockBaseAddress(pixel, [])
  guard adaptor.append(pixel, withPresentationTime: CMTime(value: Int64(index), timescale: 24)) else { fatalError("Append: \(String(describing: writer.error))") }
}
track.markAsFinished()
let finished = DispatchSemaphore(value: 0)
writer.endSession(atSourceTime: CMTime(value: 288, timescale: 24))
writer.finishWriting { finished.signal() }
finished.wait()
guard writer.status == .completed else { fatalError("Finish: \(String(describing: writer.error))") }
print("Encoded \(output.lastPathComponent)")
