# Using official Rust image
FROM rust:latest as builder

# Create a new empty shell project
RUN USER=root cargo new --bin backend
WORKDIR /backend

# Copy our manifests
COPY ./Cargo.toml ./Cargo.toml
COPY ./Cargo.lock ./Cargo.lock

# Build only the dependencies to cache them
RUN cargo build --release
RUN rm src/*.rs

# Now copy the rest of the files
COPY ./src ./src

# Build for release
RUN rm ./target/release/deps/backend*
RUN cargo build --release

# Final stage for smaller image size
FROM debian:buster-slim
COPY --from=builder /backend/target/release/backend .
EXPOSE 8000
CMD ["./backend"]
